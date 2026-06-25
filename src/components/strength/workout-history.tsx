"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Trash2, Pencil } from "lucide-react"
import { ConfirmModal } from "@/components/confirm-modal"
import { EditWorkoutForm } from "@/components/strength/edit-workout-form"
import { apiDelete } from "@/lib/api-client"
import type { WorkoutWithExercises } from "@/lib/queries"

const categoryColors: Record<string, string> = {
  Back: "bg-emerald-900/40 text-emerald-400",
  Chest: "bg-pink-900/40 text-pink-400",
  Shoulders: "bg-violet-900/40 text-violet-400",
  Arms: "bg-amber-900/40 text-amber-400",
  Legs: "bg-orange-900/40 text-orange-400",
  Core: "bg-teal-900/40 text-teal-400",
  Groin: "bg-red-900/40 text-red-400",
  Recovery: "bg-slate-800/40 text-slate-400",
  Prehab: "bg-cyan-900/40 text-cyan-400",
  Cardio: "bg-yellow-900/40 text-yellow-400",
}

export function WorkoutHistory({ workouts }: { workouts: WorkoutWithExercises[] }) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WorkoutWithExercises | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editTarget, setEditTarget] = useState<WorkoutWithExercises | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await apiDelete(`/api/workouts/${deleteTarget.id}`)
    setDeleting(false)
    setDeleteTarget(null)
    router.refresh()
  }

  if (workouts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No workouts logged yet. Add your first one above.</p>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Workout History</h3>
      {workouts.map((workout) => {
        const isOpen = expandedId === workout.id
        const totalSets = workout.exercises.reduce((s, ex) => s + ex.sets, 0)
        const categories = [...new Set(workout.exercises.map((ex) => ex.category))]

        return (
          <div key={workout.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div
              onClick={() => setExpandedId(isOpen ? null : workout.id)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-accent/30 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-semibold">{workout.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {workout.exercises.length} exercises &middot; {totalSets} sets
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {workout.date.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "2-digit" })}
                  </span>
                  <div className="flex gap-1">
                    {categories.map((cat) => (
                      <span key={cat} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColors[cat] ?? "bg-muted text-muted-foreground"}`}>
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setEditTarget(workout) }}
                className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(workout) }}
                className="p-2 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {isOpen && (
              <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
                {workout.exercises.map((ex) => (
                  <div key={ex.id} className="flex items-center gap-3 rounded-lg bg-background px-3 py-2.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${categoryColors[ex.category] ?? "bg-muted text-muted-foreground"}`}>
                      {ex.category}
                    </span>
                    <span className="text-sm font-medium flex-1">{ex.name}</span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {ex.sets} &times; {ex.reps ? `${ex.reps} reps` : `${ex.duration}s`}
                    </span>
                    {ex.weight && (
                      <span className="text-sm font-semibold tabular-nums">{ex.weight}kg</span>
                    )}
                  </div>
                ))}
                {workout.notes && (
                  <p className="text-xs text-muted-foreground italic mt-2 px-1">{workout.notes}</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Workout"
        message={deleteTarget ? `Remove "${deleteTarget.name}" on ${deleteTarget.date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "2-digit" })} and all its exercises? This cannot be undone.` : ""}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {editTarget && (
        <EditWorkoutForm workout={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </>
  )
}
