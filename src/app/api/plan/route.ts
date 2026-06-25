import { NextResponse } from "next/server"
import { generatePlan } from "@/lib/gemini"
import { loadSwimActivities, loadWorkouts, loadTrainingNotes, savePlan, getMonday } from "@/lib/queries"
import { rateLimit } from "@/lib/rate-limit"
import type { Activity } from "@/lib/activity-utils"

const MAX_PROMPT_LENGTH = 500

function sanitizePrompt(input: string): string {
  return input
    .slice(0, MAX_PROMPT_LENGTH)
    .replace(/ignore.*(?:previous|above|system|instructions)/gi, "")
    .replace(/you are now/gi, "")
    .replace(/new instructions/gi, "")
    .replace(/forget.*(?:everything|instructions|rules)/gi, "")
    .trim()
}

export async function POST(request: Request) {
  const { allowed, remaining } = rateLimit("plan-generate", 5, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. You can generate up to 5 plans per hour." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
    )
  }

  const body = await request.json()
  const { prompt } = body

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
  }

  const cleanPrompt = prompt ? sanitizePrompt(String(prompt)) : undefined

  const swims = (await loadSwimActivities()) as Activity[]
  const workouts = await loadWorkouts()
  const notes = (await loadTrainingNotes()).map((n) => n.content)
  const weekStart = getMonday(new Date())

  try {
    const generated = await generatePlan(swims, workouts, cleanPrompt, notes)

    const plan = await savePlan({
      name: generated.name,
      weekStart,
      summary: generated.summary,
      days: generated.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        type: d.type,
        focus: d.focus,
        notes: d.notes ?? null,
        items: d.items.map((item) => ({
          name: item.name,
          detail: item.detail ?? null,
          tag: item.tag ?? null,
        })),
      })),
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate plan"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
