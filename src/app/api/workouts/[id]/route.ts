import { NextResponse } from "next/server"
import { deleteWorkout, updateWorkout } from "@/lib/queries"

const ALLOWED_CATEGORIES = [
  "Back", "Chest", "Shoulders", "Arms", "Legs", "Core", "Groin", "Recovery", "Prehab", "Cardio",
]

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })

  try {
    await deleteWorkout(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })

  const body = await request.json()
  const { date, name, duration, notes, exercises } = body

  if (!date || !name) {
    return NextResponse.json({ error: "Date and name are required" }, { status: 400 })
  }

  if (!Array.isArray(exercises) || exercises.length === 0) {
    return NextResponse.json({ error: "At least one exercise is required" }, { status: 400 })
  }

  for (const ex of exercises) {
    if (!ex.name || !ex.category || !ex.sets) {
      return NextResponse.json({ error: "Each exercise needs name, category, and sets" }, { status: 400 })
    }
    if (!ALLOWED_CATEGORIES.includes(ex.category)) {
      return NextResponse.json({ error: `Invalid category: ${ex.category}` }, { status: 400 })
    }
  }

  try {
    const updated = await updateWorkout(id, {
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
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 })
  }
}
