"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Waves, Ruler, Timer, TrendingUp, Dumbbell, Weight, Calendar, Target } from "lucide-react"
import { PaceChart } from "@/components/dashboard/pace-chart"
import { VolumeChart } from "@/components/dashboard/volume-chart"
import { RecentSwims } from "@/components/dashboard/recent-swims"
import {
  type Activity,
  type TimeRange,
  filterByRange,
  getSwimActivities,
  getMonthlySwimStats,
  formatPace,
  formatDuration,
} from "@/lib/activity-utils"
import type { WorkoutWithExercises, PlanWithDays } from "@/lib/queries"

type SerializedActivity = Omit<Activity, "date"> & { date: string }
type SerializedWorkout = Omit<WorkoutWithExercises, "date"> & { date: string }
type SerializedPlan = Omit<PlanWithDays, "createdAt" | "weekStart"> & { createdAt: string; weekStart: string } | null

const rangeOptions: { value: TimeRange; label: string }[] = [
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
]

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const typeIcons: Record<string, string> = { Swim: "🏊", Gym: "💪", Run: "🏃", Rest: "😴" }
const typeColors: Record<string, string> = {
  Swim: "text-sky-400",
  Gym: "text-emerald-400",
  Run: "text-orange-400",
  Rest: "text-zinc-500",
}

export function DashboardContent({
  activities: rawActivities,
  workouts: rawWorkouts,
  plan,
}: {
  activities: SerializedActivity[]
  workouts: SerializedWorkout[]
  plan: SerializedPlan
}) {
  const activities: Activity[] = rawActivities.map((a) => ({ ...a, date: new Date(a.date) }))
  const workouts: WorkoutWithExercises[] = rawWorkouts.map((w) => ({ ...w, date: new Date(w.date) }))
  const [range, setRange] = useState<TimeRange>("all")

  const filtered = filterByRange(activities, range)
  const swims = getSwimActivities(filtered)
  const runs = filtered.filter((a) => a.type === "Run")
  const monthlyStats = getMonthlySwimStats(swims)

  // Swim stats
  const totalDistKm = swims.reduce((sum, a) => sum + a.distance, 0) / 1000
  const paces = swims
    .filter((a) => a.distance > 0 && a.movingTime > 0)
    .map((a) => ({ pace: (a.movingTime / a.distance) * 100, activity: a }))
  const bestPaceEntry = paces.length > 0
    ? paces.reduce((best, curr) => (curr.pace < best.pace ? curr : best))
    : null

  // Strength stats (filtered by range too)
  const filteredWorkouts = range === "all" ? workouts : (() => {
    const now = new Date()
    const cutoff = new Date(now)
    if (range === "3m") cutoff.setMonth(now.getMonth() - 3)
    else if (range === "6m") cutoff.setMonth(now.getMonth() - 6)
    else if (range === "1y") cutoff.setFullYear(now.getFullYear() - 1)
    return workouts.filter((w) => w.date >= cutoff)
  })()

  const totalSets = filteredWorkouts.reduce((sum, w) => sum + w.exercises.reduce((s, ex) => s + ex.sets, 0), 0)
  const totalVolume = filteredWorkouts.reduce((sum, w) =>
    sum + w.exercises.reduce((s, ex) => s + ex.sets * (ex.reps ?? 0) * (ex.weight ?? 0), 0), 0)

  // Weekly summary
  const now = new Date()
  const mondayOfWeek = new Date(now)
  const dayOfWeek = now.getDay()
  mondayOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  mondayOfWeek.setHours(0, 0, 0, 0)

  const thisWeekSwims = activities.filter((a) => a.type === "Swim" && a.date >= mondayOfWeek)
  const thisWeekRuns = activities.filter((a) => a.type === "Run" && a.date >= mondayOfWeek)
  const thisWeekWorkouts = workouts.filter((w) => w.date >= mondayOfWeek)
  const thisWeekSwimDist = thisWeekSwims.reduce((sum, a) => sum + a.distance, 0)

  // Today's plan
  const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const todayPlan = plan?.days.find((d) => d.dayOfWeek === todayIdx)

  const recentSwims = swims.slice(0, 8).map((s) => ({
    date: s.date.toLocaleDateString("en-AU", { month: "short", day: "numeric" }),
    distance: s.distance >= 1000 ? `${(s.distance / 1000).toFixed(1)}km` : `${s.distance}m`,
    pace: formatPace(s.distance, s.movingTime),
    duration: formatDuration(s.movingTime),
    hr: s.avgHeartRate,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your training overview
          </p>
        </div>

        <div className="flex gap-1">
          {rangeOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={range === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(opt.value)}
              className="text-xs px-3"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">This Week</span>
        </div>
        <div className="flex gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏊</span>
            <span className="text-sm">
              <span className="font-bold">{thisWeekSwims.length}</span> swims
              {thisWeekSwimDist > 0 && <span className="text-muted-foreground"> &middot; {(thisWeekSwimDist / 1000).toFixed(1)}km</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">💪</span>
            <span className="text-sm">
              <span className="font-bold">{thisWeekWorkouts.length}</span> workouts
            </span>
          </div>
          {thisWeekRuns.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-lg">🏃</span>
              <span className="text-sm">
                <span className="font-bold">{thisWeekRuns.length}</span> runs
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Today's Workout */}
      {todayPlan && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today — {DAY_NAMES[todayIdx]}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{typeIcons[todayPlan.type] ?? "📋"}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{todayPlan.focus}</span>
                <span className={`text-xs font-semibold ${typeColors[todayPlan.type] ?? ""}`}>
                  {todayPlan.type.toUpperCase()}
                </span>
              </div>
              {todayPlan.notes && (
                <p className="text-xs text-muted-foreground mt-0.5">{todayPlan.notes}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {todayPlan.items.length} exercises &middot; <a href="/plan" className="text-primary hover:underline">View full plan</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Waves className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Swim Sessions</span>
          </div>
          <div className="text-2xl font-bold tracking-tight">{swims.length}</div>
          <div className="text-xs text-muted-foreground mt-1">{totalDistKm.toFixed(1)}km total</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Best Pace</span>
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {bestPaceEntry ? formatPace(bestPaceEntry.activity.distance, bestPaceEntry.activity.movingTime) : "--"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">per 100m</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gym Sessions</span>
          </div>
          <div className="text-2xl font-bold tracking-tight">{filteredWorkouts.length}</div>
          <div className="text-xs text-muted-foreground mt-1">{totalSets} total sets</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Weight className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Volume</span>
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : "--"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">sets × reps × weight</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaceChart data={monthlyStats} />
        <VolumeChart data={monthlyStats} />
      </div>

      <RecentSwims swims={recentSwims} />
    </div>
  )
}
