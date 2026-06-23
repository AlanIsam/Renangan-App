"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dumbbell, Calendar, TrendingUp, Weight } from "lucide-react"
import { AddWorkoutForm } from "@/components/strength/add-workout-form"
import { WorkoutHistory } from "@/components/strength/workout-history"
import type { WorkoutWithExercises } from "@/lib/queries"

type SerializedWorkout = Omit<WorkoutWithExercises, "date"> & { date: string }

type TimeRange = "3m" | "6m" | "1y" | "all"

const rangeOptions: { value: TimeRange; label: string }[] = [
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
]

function filterByRange(workouts: WorkoutWithExercises[], range: TimeRange): WorkoutWithExercises[] {
  if (range === "all") return workouts
  const now = new Date()
  const cutoff = new Date(now)
  if (range === "3m") cutoff.setMonth(now.getMonth() - 3)
  else if (range === "6m") cutoff.setMonth(now.getMonth() - 6)
  else if (range === "1y") cutoff.setFullYear(now.getFullYear() - 1)
  return workouts.filter((w) => w.date >= cutoff)
}

export function StrengthContent({ workouts: raw }: { workouts: SerializedWorkout[] }) {
  const [range, setRange] = useState<TimeRange>("all")

  const allWorkouts: WorkoutWithExercises[] = raw.map((w) => ({ ...w, date: new Date(w.date) }))
  const workouts = filterByRange(allWorkouts, range)

  const totalSessions = workouts.length
  const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0)
  const totalSets = workouts.reduce((sum, w) => sum + w.exercises.reduce((s, ex) => s + ex.sets, 0), 0)
  const totalVolume = workouts.reduce((sum, w) =>
    sum + w.exercises.reduce((s, ex) => s + ex.sets * (ex.reps ?? 0) * (ex.weight ?? 0), 0), 0)

  const categories = new Map<string, number>()
  for (const w of workouts) {
    for (const ex of w.exercises) {
      categories.set(ex.category, (categories.get(ex.category) ?? 0) + ex.sets)
    }
  }
  const topCategory = categories.size > 0
    ? Array.from(categories.entries()).reduce((best, curr) => curr[1] > best[1] ? curr : best)
    : null

  const stats = [
    { label: "Workouts", value: String(totalSessions), sub: "total sessions", icon: Dumbbell },
    { label: "Total Sets", value: String(totalSets), sub: `across ${totalExercises} exercises`, icon: TrendingUp },
    { label: "Volume", value: totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : "--", sub: "sets x reps x weight", icon: Weight },
    { label: "Top Focus", value: topCategory ? topCategory[0] : "--", sub: topCategory ? `${topCategory[1]} sets` : "", icon: Calendar },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Strength Training</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your gym sessions and exercises
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <AddWorkoutForm />
          <div className="flex gap-1">
            {rangeOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={range === opt.value ? "default" : "outline"}
                size="lg"
                onClick={() => setRange(opt.value)}
                className="text-md px-3"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      <WorkoutHistory workouts={workouts} />
    </div>
  )
}
