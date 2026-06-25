import { NextResponse } from "next/server"
import { generateInsights } from "@/lib/gemini"
import { loadSwimActivities, loadWorkouts } from "@/lib/queries"
import { rateLimit } from "@/lib/rate-limit"
import type { Activity } from "@/lib/activity-utils"

export async function POST() {
  const { allowed } = rateLimit("insights-generate", 5, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
  }

  const swims = (await loadSwimActivities()) as Activity[]
  const workouts = await loadWorkouts()

  try {
    const insights = await generateInsights(swims, workouts)
    return NextResponse.json(insights)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate insights"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
