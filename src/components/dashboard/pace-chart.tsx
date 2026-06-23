"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import type { MonthlyStats } from "@/lib/activity-utils"

function secToMMSS(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

function PaceTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>
          {p.name === "avgPace" ? "Avg" : "Best"}: {secToMMSS(p.value)}/100m
        </p>
      ))}
    </div>
  )
}

export function PaceChart({ data }: { data: MonthlyStats[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Pace Trend per 100m</h3>
        <p className="text-xs text-muted-foreground mt-0.5 font-extrabold">
          Lower is Faster
        </p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
          />
          <YAxis
            tickFormatter={secToMMSS}
            domain={[110, 280]}
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
          />
          <Tooltip content={<PaceTooltip />} />
          <ReferenceLine
            y={120}
            strokeDasharray="4 4"
            strokeOpacity={0.4}
            className="stroke-primary"
            label={{ value: "2:00", position: "right", fontSize: 10, className: "fill-muted-foreground" }}
          />
          <Line
            type="monotone"
            dataKey="avgPace"
            strokeWidth={2}
            dot={{ r: 3 }}
            className="stroke-chart-1"
            name="avgPace"
          />
          <Line
            type="monotone"
            dataKey="bestPace"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 3 }}
            className="stroke-chart-2"
            name="bestPace"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 rounded bg-chart-1" />
          <span className="text-xs text-muted-foreground">Avg Pace</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 rounded bg-chart-2 opacity-70" />
          <span className="text-xs text-muted-foreground">Best Pace</span>
        </div>
      </div>
    </div>
  )
}
