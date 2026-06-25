import { NextResponse } from "next/server"
import { generateInsights } from "@/lib/gemini"
import { loadSwimActivities, loadWorkouts, loadTrainingNotes, getLatestInsightReport, saveInsightReport } from "@/lib/queries"
import { rateLimit } from "@/lib/rate-limit"
import type { Activity } from "@/lib/activity-utils"

export async function GET() {
  const report = await getLatestInsightReport()
  if (!report) return NextResponse.json(null)

  return NextResponse.json({
    overall: report.overall,
    swim: JSON.parse(report.swimInsights),
    strength: JSON.parse(report.strengthInsights),
    recommendations: JSON.parse(report.recommendations),
    createdAt: report.createdAt,
  })
}

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
  const notes = (await loadTrainingNotes()).map((n) => n.content)

  try {
    const insights = await generateInsights(swims, workouts, notes)

    await saveInsightReport({
      overall: insights.overall,
      swimInsights: JSON.stringify(insights.swim),
      strengthInsights: JSON.stringify(insights.strength),
      recommendations: JSON.stringify(insights.recommendations),
    })

    return NextResponse.json(insights)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate insights"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
