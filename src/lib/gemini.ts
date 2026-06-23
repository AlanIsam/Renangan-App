import { GoogleGenAI } from "@google/genai"
import type { Activity } from "@/lib/activity-utils"
import type { WorkoutWithExercises } from "@/lib/queries"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

type PlanDay = {
  dayOfWeek: number
  type: string
  focus: string
  notes: string
  items: { name: string; detail: string; tag: string }[]
}

type GeneratedPlan = {
  name: string
  summary: string
  days: PlanDay[]
}

function buildContext(swims: Activity[], workouts: WorkoutWithExercises[]): string {
  const recentSwims = swims.slice(0, 10)
  const recentWorkouts = workouts.slice(0, 5)

  let context = "## User's Recent Training Data\n\n"

  if (recentSwims.length > 0) {
    context += "### Recent Swims (newest first):\n"
    for (const s of recentSwims) {
      const pace = s.distance > 0 && s.movingTime > 0
        ? `${Math.floor((s.movingTime / s.distance) * 100 / 60)}:${String(Math.round((s.movingTime / s.distance) * 100 % 60)).padStart(2, "0")}/100m`
        : "unknown pace"
      context += `- ${s.date.toLocaleDateString("en-AU")}: ${s.distance}m in ${Math.round(s.movingTime / 60)}min (${pace})`
      if (s.avgHeartRate) context += `, HR ${s.avgHeartRate}bpm`
      context += "\n"
    }
    const totalDist = swims.reduce((sum, s) => sum + s.distance, 0)
    context += `\nTotal: ${swims.length} swim sessions, ${(totalDist / 1000).toFixed(1)}km total\n`
  } else {
    context += "No swim data recorded yet.\n"
  }

  if (recentWorkouts.length > 0) {
    context += "\n### Recent Gym Workouts (newest first):\n"
    for (const w of recentWorkouts) {
      context += `- ${w.date.toLocaleDateString("en-AU")}: ${w.name}\n`
      for (const ex of w.exercises) {
        context += `  - ${ex.name} (${ex.category}): ${ex.sets} sets`
        if (ex.reps) context += ` x ${ex.reps} reps`
        if (ex.weight) context += ` @ ${ex.weight}kg`
        if (ex.duration) context += ` x ${ex.duration}s`
        context += "\n"
      }
    }
    context += `\nTotal: ${workouts.length} gym sessions\n`
  } else {
    context += "\nNo gym workout data recorded yet.\n"
  }

  return context
}

export async function generatePlan(
  swims: Activity[],
  workouts: WorkoutWithExercises[],
  userPrompt?: string
): Promise<GeneratedPlan> {
  const context = buildContext(swims, workouts)

  const systemPrompt = `You are a swim and strength training coach. Generate a weekly training plan based on the user's actual training data.

${context}

${userPrompt ? `User's request: ${userPrompt}` : "Generate a balanced weekly plan based on the user's current fitness level and training history."}

Respond with ONLY valid JSON in this exact format, no markdown, no code blocks:
{
  "name": "Plan name (short, descriptive)",
  "summary": "1-2 sentence summary of the plan's focus",
  "days": [
    {
      "dayOfWeek": 0,
      "type": "Swim",
      "focus": "Technique + Speed",
      "notes": "Brief coaching note for the day",
      "items": [
        { "name": "400m warm up", "detail": "Easy freestyle, focus on breathing", "tag": "Warmup" },
        { "name": "6x100m descending", "detail": "Each rep faster than last", "tag": "Speed" }
      ]
    }
  ]
}

Rules:
- dayOfWeek: 0=Monday, 1=Tuesday, ..., 6=Sunday
- type must be one of: "Swim", "Gym", "Run", "Rest"
- Include all 7 days (0-6)
- tag should be one of: Warmup, Cooldown, Drill, Speed, Endurance, Pace, Main Set, Back, Chest, Shoulders, Arms, Legs, Core, Recovery, Prehab, Cardio, Optional
- Base the plan on the user's actual pace, distances, and exercises — don't make it too easy or too hard
- Include at least 1 rest day
- For gym days, include specific sets, reps, and suggested weights based on their history
- For swim days, include distances and target paces based on their recent performance`

  const MAX_RETRIES = 3
  const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

  let lastError: Error | null = null

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: systemPrompt,
        })

        const text = response.text?.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
        if (!text) throw new Error("No response from Gemini")

        return JSON.parse(text) as GeneratedPlan
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        const isRetryable = lastError.message.includes("503") ||
          lastError.message.includes("UNAVAILABLE") ||
          lastError.message.includes("overloaded") ||
          lastError.message.includes("high demand") ||
          lastError.message.includes("RESOURCE_EXHAUSTED")

        if (isRetryable && attempt < MAX_RETRIES) {
          const delay = attempt * 2000
          await new Promise((r) => setTimeout(r, delay))
          continue
        }

        if (isRetryable) break
        throw lastError
      }
    }
  }

  throw lastError ?? new Error("All models failed to generate a plan")
}
