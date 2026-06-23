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
import type { MonthlyStats } from "@/lib/activity-utils"

function VolumeTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>
          {p.name === "distanceKm" ? `Volume: ${p.value.toFixed(1)} km` : `Sessions: ${p.value}`}
        </p>
      ))}
    </div>
  )
}

export function VolumeChart({ data }: { data: MonthlyStats[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Monthly Volume & Sessions</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Distance swam and session count per month
        </p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
          />
          <Tooltip content={<VolumeTooltip />} />
          <Bar
            dataKey="distanceKm"
            name="distanceKm"
            radius={[4, 4, 0, 0]}
            className="fill-chart-1"
          />
          <Bar
            dataKey="sessions"
            name="sessions"
            radius={[4, 4, 0, 0]}
            className="fill-chart-2"
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-chart-1" />
          <span className="text-xs text-muted-foreground">Distance (km)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-chart-2" />
          <span className="text-xs text-muted-foreground">Sessions</span>
        </div>
      </div>
    </div>
  )
}
