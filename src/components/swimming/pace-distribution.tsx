"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { type Activity } from "@/lib/activity-utils"

function buildBuckets(swims: Activity[]) {
  const buckets = new Map<string, number>()
  const bucketOrder: string[] = []

  for (let start = 110; start <= 300; start += 10) {
    const end = start + 10
    const startMin = Math.floor(start / 60)
    const startSec = start % 60
    const endMin = Math.floor(end / 60)
    const endSec = end % 60
    const label = `${startMin}:${String(startSec).padStart(2, "0")}–${endMin}:${String(endSec).padStart(2, "0")}`
    buckets.set(label, 0)
    bucketOrder.push(label)
  }

  for (const swim of swims) {
    if (swim.distance <= 0 || swim.movingTime <= 0) continue
    const pace = (swim.movingTime / swim.distance) * 100

    for (let i = 0; i < bucketOrder.length; i++) {
      const start = 110 + i * 10
      const end = start + 10
      if (pace >= start && pace < end) {
        buckets.set(bucketOrder[i], (buckets.get(bucketOrder[i]) ?? 0) + 1)
        break
      }
    }
  }

  return bucketOrder
    .map((label) => ({ range: label, count: buckets.get(label) ?? 0 }))
    .filter((b) => b.count > 0)
}

function DistTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-foreground">{label}/100m</p>
      <p className="text-xs text-muted-foreground">{payload[0].value} sessions</p>
    </div>
  )
}

export function PaceDistribution({ swims }: { swims: Activity[] }) {
  const data = buildBuckets(swims)

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Pace Distribution</h3>
        <p className="text-xs text-muted-foreground mt-2">No swim data available</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Pace Distribution</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          How many sessions fall into each pace range
        </p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 10 }}
            className="fill-muted-foreground"
            interval={0}
            angle={-35}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            allowDecimals={false}
          />
          <Tooltip content={<DistTooltip />} />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            className="fill-chart-1"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
