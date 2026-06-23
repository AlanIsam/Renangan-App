import { NextResponse } from "next/server"
import { createWorkout } from "@/lib/queries"
import { rateLimit } from "@/lib/rate-limit"

const ALLOWED_CATEGORIES = [
  "Back", "Chest", "Shoulders", "Arms", "Legs", "Core", "Groin", "Recovery", "Prehab", "Cardio",
]

const MAX_EXERCISES = 20

export async function POST(request: Request) {
  const { allowed } = rateLimit("workouts-create", 20, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
  }

  const body = await request.json()
  const { date, name, duration, notes, exercises } = body

  if (!date || !name) {
    return NextResponse.json({ error: "Date and name are required" }, { status: 400 })
  }

  if (!Array.isArray(exercises) || exercises.length === 0) {
    return NextResponse.json({ error: "At least one exercise is required" }, { status: 400 })
  }

  if (exercises.length > MAX_EXERCISES) {
    return NextResponse.json({ error: `Maximum ${MAX_EXERCISES} exercises per workout` }, { status: 400 })
  }

  for (const ex of exercises) {
    if (!ex.name || !ex.category || !ex.sets) {
      return NextResponse.json({ error: "Each exercise needs name, category, and sets" }, { status: 400 })
    }
    if (!ALLOWED_CATEGORIES.includes(ex.category)) {
      return NextResponse.json({ error: `Invalid category: ${ex.category}` }, { status: 400 })
    }
    if (typeof ex.sets !== "number" || ex.sets < 1) {
      return NextResponse.json({ error: "Sets must be at least 1" }, { status: 400 })
    }
  }

  const workout = await createWorkout({
    date: new Date(date),
    name: String(name).slice(0, 200),
    duration: duration ?? null,
    notes: notes ? String(notes).slice(0, 500) : null,
    exercises: exercises.map((ex: { name: string; category: string; sets: number; reps?: number; weight?: number; duration?: number }) => ({
      name: String(ex.name).slice(0, 100),
      category: ex.category,
      sets: ex.sets,
      reps: ex.reps ?? null,
      weight: ex.weight ?? null,
      duration: ex.duration ?? null,
    })),
  })

  return NextResponse.json(workout, { status: 201 })
}
