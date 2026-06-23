import { Waves, Ruler, Timer, TrendingUp } from "lucide-react"

type StatsCardsProps = {
  totalSessions: number
  totalDistKm: number
  bestPace: string
  peakMonth: string
  peakMonthDetail: string
}

const cards = [
  { key: "sessions", label: "Swim Sessions", icon: Waves },
  { key: "distance", label: "Total Distance", icon: Ruler },
  { key: "pace", label: "Best Pace", icon: Timer },
  { key: "peak", label: "Peak Month", icon: TrendingUp },
] as const

export function StatsCards({
  totalSessions,
  totalDistKm,
  bestPace,
  peakMonth,
  peakMonthDetail,
}: StatsCardsProps) {
  const values: Record<string, { value: string; sub: string }> = {
    sessions: { value: String(totalSessions), sub: "total recorded" },
    distance: { value: `${totalDistKm.toFixed(1)}km`, sub: "in the pool" },
    pace: { value: `${bestPace}`, sub: "per 100m" },
    peak: { value: peakMonth, sub: peakMonthDetail },
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const data = values[card.key]
        return (
          <div
            key={card.key}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <card.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {card.label}
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight">{data.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{data.sub}</div>
          </div>
        )
      })}
    </div>
  )
}
