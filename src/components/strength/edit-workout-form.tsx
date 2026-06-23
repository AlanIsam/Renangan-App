"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiPut } from "@/lib/api-client"
import type { WorkoutWithExercises } from "@/lib/queries"

const CATEGORIES = [
  "Back", "Chest", "Shoulders", "Arms", "Legs", "Core", "Groin", "Recovery", "Prehab", "Cardio",
]

type ExerciseEntry = {
  name: string
  category: string
  sets: string
  reps: string
  weight: string
  duration: string
}

type EditWorkoutFormProps = {
  workout: WorkoutWithExercises
  onClose: () => void
}

export function EditWorkoutForm({ workout, onClose }: EditWorkoutFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    date: workout.date.toISOString().split("T")[0],
    name: workout.name,
    duration: workout.duration ? String(workout.duration) : "",
    notes: workout.notes ?? "",
  })

  const [exercises, setExercises] = useState<ExerciseEntry[]>(
    workout.exercises.map((ex) => ({
      name: ex.name,
      category: ex.category,
      sets: String(ex.sets),
      reps: ex.reps ? String(ex.reps) : "",
      weight: ex.weight ? String(ex.weight) : "",
      duration: ex.duration ? String(ex.duration) : "",
    }))
  )

  const addExercise = () => setExercises([...exercises, { name: "", category: "Back", sets: "3", reps: "", weight: "", duration: "" }])

  const removeExercise = (idx: number) => {
    if (exercises.length <= 1) return
    setExercises(exercises.filter((_, i) => i !== idx))
  }

  const updateExercise = (idx: number, field: keyof ExerciseEntry, value: string) => {
    const updated = [...exercises]
    updated[idx] = { ...updated[idx], [field]: value }
    setExercises(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    if (!form.name) { setError("Enter a workout name"); setSaving(false); return }

    const parsedExercises = exercises.map((ex) => ({
      name: ex.name,
      category: ex.category,
      sets: parseInt(ex.sets) || 0,
      reps: ex.reps ? parseInt(ex.reps) : null,
      weight: ex.weight ? parseFloat(ex.weight) : null,
      duration: ex.duration ? parseFloat(ex.duration) : null,
    }))

    for (const ex of parsedExercises) {
      if (!ex.name) { setError("Every exercise needs a name"); setSaving(false); return }
      if (ex.sets < 1) { setError("Sets must be at least 1"); setSaving(false); return }
      if (!ex.reps && !ex.duration) { setError(`${ex.name}: enter reps or duration`); setSaving(false); return }
    }

    const res = await apiPut(`/api/workouts/${workout.id}`, {
      date: form.date,
      name: form.name,
      duration: form.duration ? parseFloat(form.duration) : null,
      notes: form.notes || null,
      exercises: parsedExercises,
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to save")
      setSaving(false)
      return
    }

    setSaving(false)
    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Edit Workout</h3>
          <Button variant="ghost" size="icon-lg" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-5">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Date</label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-11 text-base" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Workout Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 text-base" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Duration (min)</label>
              <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} min="0" className="h-11 text-base" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">Exercises</label>
              <Button type="button" variant="outline" size="sm" onClick={addExercise} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Add Exercise
              </Button>
            </div>

            <div className="space-y-3">
              {exercises.map((ex, idx) => (
                <div key={idx} className="rounded-lg border border-border bg-background p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground w-6">{idx + 1}.</span>
                    <Input value={ex.name} onChange={(e) => updateExercise(idx, "name", e.target.value)} placeholder="Exercise name" className="h-10 text-base flex-1" />
                    <select value={ex.category} onChange={(e) => updateExercise(idx, "category", e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
                      {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    {exercises.length > 1 && (
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeExercise(idx)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3 pl-8">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Sets</label>
                      <Input type="number" value={ex.sets} onChange={(e) => updateExercise(idx, "sets", e.target.value)} min="1" className="h-9" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Reps</label>
                      <Input type="number" value={ex.reps} onChange={(e) => updateExercise(idx, "reps", e.target.value)} min="0" className="h-9" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Weight (kg)</label>
                      <Input type="number" value={ex.weight} onChange={(e) => updateExercise(idx, "weight", e.target.value)} min="0" step="0.5" className="h-9" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Duration (s)</label>
                      <Input type="number" value={ex.duration} onChange={(e) => updateExercise(idx, "duration", e.target.value)} min="0" className="h-9" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Notes</label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" className="h-11 text-base" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" size="lg" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="lg" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
