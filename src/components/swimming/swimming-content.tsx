"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Waves, Ruler, Timer, Heart } from "lucide-react"
import { SwimTable } from "@/components/swimming/swim-table"
import { PersonalBests } from "@/components/swimming/personal-bests"
import { PaceDistribution } from "@/components/swimming/pace-distribution"
import { AddSwimForm } from "@/components/swimming/add-swim-form"
import {
  type Activity,
  type TimeRange,
  filterByRange,
  formatPace,
  formatDuration,
} from "@/lib/activity-utils"

type SerializedSwim = Omit<Activity, "date"> & { date: string }

const rangeOptions: { value: TimeRange; label: string }[] = [
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
]

export function SwimmingContent({ swims: raw }: { swims: SerializedSwim[] }) {
  const [range, setRange] = useState<TimeRange>("all")

  const allSwims: Activity[] = raw.map((s) => ({ ...s, date: new Date(s.date) }))
  const swims = filterByRange(allSwims, range)

  const totalDist = swims.reduce((sum, s) => sum + s.distance, 0)
  const totalTime = swims.reduce((sum, s) => sum + s.movingTime, 0)

  const paces = swims
    .filter((s) => s.distance > 0 && s.movingTime > 0)
    .map((s) => (s.movingTime / s.distance) * 100)
  const avgPace = paces.length > 0 ? paces.reduce((a, b) => a + b, 0) / paces.length : 0

  const heartRates = swims
    .map((s) => s.avgHeartRate)
    .filter((hr): hr is number => hr !== null && hr > 0)
  const avgHR = heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : null

  const stats = [
    { label: "Sessions", value: String(swims.length), sub: "total swims", icon: Waves },
    { label: "Distance", value: `${(totalDist / 1000).toFixed(1)}km`, sub: `${totalDist.toLocaleString()}m total`, icon: Ruler },
    { label: "Avg Pace", value: formatPace(1, avgPace / 100), sub: "per 100m", icon: Timer },
    { label: "Avg Heart Rate", value: avgHR ? `${avgHR} bpm` : "--", sub: "across sessions", icon: Heart },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Swimming</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All your swim sessions in detail
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <AddSwimForm />
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

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-lg text-muted-foreground">
          Total time in water: {formatDuration(totalTime)}
        </p>
      </div>

      <PersonalBests swims={swims} />

      <PaceDistribution swims={swims} />

      <SwimTable swims={swims} />
    </div>
  )
}
