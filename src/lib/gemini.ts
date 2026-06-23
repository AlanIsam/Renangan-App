import { GoogleGenAI } from "@google/genai"
import type { Activity } from "@/lib/activity-utils"
import type { WorkoutWithExercises } from "@/lib/queries"

function getAI() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
}

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

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d.toISOString().split("T")[0]
}

function buildContext(swims: Activity[], workouts: WorkoutWithExercises[]): string {
  let context = "## User's Training Data & Analysis\n\n"

  // ── Swim Data ──
  if (swims.length > 0) {
    const recentSwims = swims.slice(0, 15)
    const paces = swims
      .filter((s) => s.distance > 0 && s.movingTime > 0)
      .map((s) => ({ pace: (s.movingTime / s.distance) * 100, date: s.date, distance: s.distance, hr: s.avgHeartRate }))

    context += "### Swim Sessions (newest first):\n"
    for (const s of recentSwims) {
      const pace = s.distance > 0 && s.movingTime > 0
        ? `${Math.floor((s.movingTime / s.distance) * 100 / 60)}:${String(Math.round((s.movingTime / s.distance) * 100 % 60)).padStart(2, "0")}/100m`
        : "unknown"
      context += `- ${s.date.toLocaleDateString("en-AU")}: ${s.distance}m in ${Math.round(s.movingTime / 60)}min (${pace})`
      if (s.avgHeartRate) context += `, HR ${s.avgHeartRate}bpm`
      context += "\n"
    }

    // Totals
    const totalDist = swims.reduce((sum, s) => sum + s.distance, 0)
    const totalTime = swims.reduce((sum, s) => sum + s.movingTime, 0)
    context += `\nSwim totals: ${swims.length} sessions, ${(totalDist / 1000).toFixed(1)}km, ${Math.round(totalTime / 3600)}h in the water\n`

    // Pace trend
    if (paces.length >= 4) {
      const recent = paces.slice(0, Math.ceil(paces.length / 2))
      const older = paces.slice(Math.ceil(paces.length / 2))
      const avgRecent = recent.reduce((s, p) => s + p.pace, 0) / recent.length
      const avgOlder = older.reduce((s, p) => s + p.pace, 0) / older.length
      const diff = avgOlder - avgRecent
      const trend = diff > 3 ? "IMPROVING" : diff < -3 ? "DECLINING" : "STABLE"
      context += `\nPace trend: ${trend} (recent avg ${Math.floor(avgRecent / 60)}:${String(Math.round(avgRecent % 60)).padStart(2, "0")} vs older avg ${Math.floor(avgOlder / 60)}:${String(Math.round(avgOlder % 60)).padStart(2, "0")}/100m)\n`
    }

    // Best pace
    if (paces.length > 0) {
      const best = paces.reduce((b, p) => p.pace < b.pace ? p : b)
      context += `Best pace: ${Math.floor(best.pace / 60)}:${String(Math.round(best.pace % 60)).padStart(2, "0")}/100m on ${best.distance}m\n`
    }

    // HR trend
    const hrs = paces.filter((p) => p.hr && p.hr > 0)
    if (hrs.length >= 4) {
      const recentHR = hrs.slice(0, Math.ceil(hrs.length / 2))
      const olderHR = hrs.slice(Math.ceil(hrs.length / 2))
      const avgRecentHR = Math.round(recentHR.reduce((s, p) => s + (p.hr ?? 0), 0) / recentHR.length)
      const avgOlderHR = Math.round(olderHR.reduce((s, p) => s + (p.hr ?? 0), 0) / olderHR.length)
      context += `HR trend: recent avg ${avgRecentHR}bpm vs older avg ${avgOlderHR}bpm\n`
    }

    // Distance distribution
    const shortSwims = swims.filter((s) => s.distance <= 300).length
    const medSwims = swims.filter((s) => s.distance > 300 && s.distance <= 800).length
    const longSwims = swims.filter((s) => s.distance > 800).length
    context += `Distance breakdown: ${shortSwims} short (≤300m), ${medSwims} medium (300-800m), ${longSwims} long (800m+)\n`

    // Weekly frequency
    const swimWeeks = new Set(swims.map((s) => getWeekStart(s.date)))
    const avgPerWeek = (swims.length / Math.max(swimWeeks.size, 1)).toFixed(1)
    context += `Avg swim frequency: ${avgPerWeek} sessions/week over ${swimWeeks.size} weeks\n`

    // Training gaps
    const lastSwim = swims[0]
    const gapDays = daysSince(lastSwim.date)
    if (gapDays > 3) context += `⚠ Last swim was ${gapDays} days ago\n`
  } else {
    context += "No swim data recorded.\n"
  }

  // ── Strength Data ──
  if (workouts.length > 0) {
    context += "\n### Gym Workouts (newest first):\n"
    const recentWorkouts = workouts.slice(0, 10)

    for (const w of recentWorkouts) {
      context += `- ${w.date.toLocaleDateString("en-AU")}: ${w.name}`
      if (w.duration) context += ` (${w.duration}min)`
      context += "\n"
      for (const ex of w.exercises) {
        context += `  - ${ex.name} (${ex.category}): ${ex.sets}sets`
        if (ex.reps) context += ` x ${ex.reps}reps`
        if (ex.weight) context += ` @ ${ex.weight}kg`
        if (ex.duration) context += ` x ${ex.duration}s`
        context += "\n"
      }
    }

    // Category breakdown
    const catSets = new Map<string, number>()
    const catExercises = new Map<string, Set<string>>()
    for (const w of workouts) {
      for (const ex of w.exercises) {
        catSets.set(ex.category, (catSets.get(ex.category) ?? 0) + ex.sets)
        if (!catExercises.has(ex.category)) catExercises.set(ex.category, new Set())
        catExercises.get(ex.category)!.add(ex.name)
      }
    }

    context += `\nGym totals: ${workouts.length} sessions\n`
    context += "Muscle group breakdown (total sets):\n"
    const sortedCats = Array.from(catSets.entries()).sort((a, b) => b[1] - a[1])
    for (const [cat, sets] of sortedCats) {
      const exercises = Array.from(catExercises.get(cat) ?? [])
      context += `- ${cat}: ${sets} sets (exercises: ${exercises.join(", ")})\n`
    }

    // Detect imbalances
    const pushSets = (catSets.get("Chest") ?? 0) + (catSets.get("Shoulders") ?? 0)
    const pullSets = (catSets.get("Back") ?? 0)
    if (pushSets > 0 && pullSets > 0) {
      const ratio = pullSets / pushSets
      if (ratio < 0.8) context += `⚠ Push/Pull imbalance: ${pushSets} push sets vs ${pullSets} pull sets (recommend more pull)\n`
    }

    const upperSets = (catSets.get("Back") ?? 0) + (catSets.get("Chest") ?? 0) + (catSets.get("Shoulders") ?? 0) + (catSets.get("Arms") ?? 0)
    const lowerSets = (catSets.get("Legs") ?? 0)
    if (upperSets > 0 && lowerSets > 0) {
      const ratio = lowerSets / upperSets
      if (ratio < 0.5) context += `⚠ Upper/Lower imbalance: ${upperSets} upper sets vs ${lowerSets} lower sets (recommend more legs)\n`
    }

    // Weight progression per exercise
    if (workouts.length >= 3) {
      context += "\nWeight progression (if tracked):\n"
      const exerciseHistory = new Map<string, { weight: number; date: Date }[]>()
      for (const w of workouts) {
        for (const ex of w.exercises) {
          if (ex.weight && ex.weight > 0) {
            if (!exerciseHistory.has(ex.name)) exerciseHistory.set(ex.name, [])
            exerciseHistory.get(ex.name)!.push({ weight: ex.weight, date: w.date })
          }
        }
      }
      for (const [name, history] of exerciseHistory) {
        if (history.length >= 2) {
          const newest = history[0].weight
          const oldest = history[history.length - 1].weight
          const diff = newest - oldest
          const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "→"
          context += `- ${name}: ${oldest}kg → ${newest}kg ${arrow}\n`
        }
      }
    }

    // Weekly frequency
    const gymWeeks = new Set(workouts.map((w) => getWeekStart(w.date)))
    const avgGymPerWeek = (workouts.length / Math.max(gymWeeks.size, 1)).toFixed(1)
    context += `Avg gym frequency: ${avgGymPerWeek} sessions/week over ${gymWeeks.size} weeks\n`

    // Gap detection
    const lastWorkout = workouts[0]
    const gymGap = daysSince(lastWorkout.date)
    if (gymGap > 4) context += `⚠ Last gym session was ${gymGap} days ago\n`
  } else {
    context += "\nNo gym workout data recorded.\n"
  }

  // ── Overall Training Load ──
  context += "\n### Overall Training Load:\n"
  const allDates = [
    ...swims.map((s) => s.date),
    ...workouts.map((w) => w.date),
  ].sort((a, b) => b.getTime() - a.getTime())

  if (allDates.length > 0) {
    const thisWeekStart = new Date()
    const dow = thisWeekStart.getDay()
    thisWeekStart.setDate(thisWeekStart.getDate() - (dow === 0 ? 6 : dow - 1))
    thisWeekStart.setHours(0, 0, 0, 0)

    const thisWeekSwims = swims.filter((s) => s.date >= thisWeekStart).length
    const thisWeekGym = workouts.filter((w) => w.date >= thisWeekStart).length
    context += `This week so far: ${thisWeekSwims} swims, ${thisWeekGym} gym sessions\n`

    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekSwims = swims.filter((s) => s.date >= lastWeekStart && s.date < thisWeekStart).length
    const lastWeekGym = workouts.filter((w) => w.date >= lastWeekStart && w.date < thisWeekStart).length
    context += `Last week: ${lastWeekSwims} swims, ${lastWeekGym} gym sessions\n`

    const totalSessions = swims.length + workouts.length
    const weeksTracked = new Set([...swims.map((s) => getWeekStart(s.date)), ...workouts.map((w) => getWeekStart(w.date))]).size
    context += `Overall: ${totalSessions} total sessions across ${weeksTracked} weeks (avg ${(totalSessions / Math.max(weeksTracked, 1)).toFixed(1)}/week)\n`
  }

  context += `\nToday is ${new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}\n`

  return context
}

export async function generatePlan(
  swims: Activity[],
  workouts: WorkoutWithExercises[],
  userPrompt?: string
): Promise<GeneratedPlan> {
  const context = buildContext(swims, workouts)

  const systemPrompt = `You are an expert swim and strength training coach. Analyze the user's training data carefully, then generate a weekly plan that addresses their specific needs.

${context}

${userPrompt ? `User's specific request: ${userPrompt}` : "Generate a balanced weekly plan optimized for this user's current fitness level and goals."}

ANALYSIS GUIDELINES — consider these before generating:
- If pace is DECLINING or HR is rising at same pace → include more recovery and Zone 2 work
- If pace is IMPROVING → maintain current intensity, add small progressive overload
- If there are training GAPS → ease back in, don't jump to full volume
- If push/pull or upper/lower IMBALANCE detected → correct it in this week's plan
- If weight progression is STALLING → suggest deload or variation
- Match swim distances to what the user actually does (don't prescribe 2000m if they typically do 500-1000m)
- Match gym weights to their actual tracked weights (don't guess)
- Consider what they did THIS WEEK already when planning remaining days

Respond with ONLY valid JSON in this exact format, no markdown, no code blocks:
{
  "name": "Plan name (short, descriptive)",
  "summary": "2-3 sentence summary explaining WHY this plan is structured this way based on the analysis",
  "days": [
    {
      "dayOfWeek": 0,
      "type": "Swim",
      "focus": "Technique + Speed",
      "notes": "Brief coaching note explaining the purpose of this session",
      "items": [
        { "name": "400m warm up", "detail": "Easy freestyle, focus on breathing rhythm", "tag": "Warmup" },
        { "name": "6x100m descending", "detail": "Start at 2:30/100m, aim for 2:15 on last rep", "tag": "Speed" }
      ]
    }
  ]
}

Rules:
- dayOfWeek: 0=Monday, 1=Tuesday, ..., 6=Sunday
- type must be one of: "Swim", "Gym", "Run", "Rest"
- Include all 7 days (0-6)
- tag: Warmup, Cooldown, Drill, Speed, Endurance, Pace, Main Set, Back, Chest, Shoulders, Arms, Legs, Core, Recovery, Prehab, Cardio, Optional
- Include at least 1 rest day, max 2 rest days
- For swim days: use specific distances and target paces based on their ACTUAL recent performance
- For gym days: use specific sets, reps, and weights based on their ACTUAL tracked exercises and weights
- Don't repeat the same muscle groups on consecutive days
- Place swim and gym on alternating days when possible
- Notes should explain WHY this session matters for their progression`

  const ai = getAI()
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
