import { Trophy, Ruler, Zap, Calendar } from "lucide-react"
import { type Activity, formatPace, formatDuration } from "@/lib/activity-utils"

function getPace(s: Activity): number {
  if (s.distance <= 0 || s.movingTime <= 0) return Infinity
  return (s.movingTime / s.distance) * 100
}

export function PersonalBests({ swims }: { swims: Activity[] }) {
  if (swims.length === 0) return null

  const fastestSwim = swims.reduce((best, s) => (getPace(s) < getPace(best) ? s : best))
  const longestSwim = swims.reduce((best, s) => (s.distance > best.distance ? s : best))
  const longestDuration = swims.reduce((best, s) => (s.movingTime > best.movingTime ? s : best))

  const sessionsByDay = new Map<string, number>()
  for (const s of swims) {
    const key = s.date.toISOString().split("T")[0]
    sessionsByDay.set(key, (sessionsByDay.get(key) ?? 0) + 1)
  }
  const busiestDay = Array.from(sessionsByDay.entries()).reduce((best, curr) =>
    curr[1] > best[1] ? curr : best
  )

  const formatDate = (d: Date) => d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "2-digit" })

  const bests = [
    {
      label: "Fastest Pace",
      value: formatPace(fastestSwim.distance, fastestSwim.movingTime) + "/100m",
      sub: `${fastestSwim.distance}m on ${formatDate(fastestSwim.date)}`,
      icon: Zap,
    },
    {
      label: "Longest Swim",
      value: longestSwim.distance >= 1000 ? `${(longestSwim.distance / 1000).toFixed(1)}km` : `${longestSwim.distance}m`,
      sub: `${formatPace(longestSwim.distance, longestSwim.movingTime)}/100m on ${formatDate(longestSwim.date)}`,
      icon: Ruler,
    },
    {
      label: "Longest Duration",
      value: formatDuration(longestDuration.movingTime),
      sub: `${longestDuration.distance}m on ${formatDate(longestDuration.date)}`,
      icon: Trophy,
    },
    {
      label: "Most Sessions in a Day",
      value: `${busiestDay[1]} sessions`,
      sub: new Date(busiestDay[0]).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "2-digit" }),
      icon: Calendar,
    },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-4">Personal Bests</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {bests.map((pb) => (
          <div key={pb.label} className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-center gap-2 mb-2">
              <pb.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {pb.label}
              </span>
            </div>
            <div className="text-lg font-bold tracking-tight">{pb.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{pb.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
