type RecentSwim = {
  date: string
  distance: string
  pace: string
  duration: string
  hr: number | null
}

export function RecentSwims({ swims }: { swims: RecentSwim[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-4">Recent Swims</h3>
      <div className="space-y-1.5">
        {swims.map((swim, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
              i === 0 ? "bg-accent" : "hover:bg-accent/50"
            }`}
          >
            <span className="w-16 text-xs text-muted-foreground">{swim.date}</span>
            <span className="w-14 text-xs font-medium">{swim.distance}</span>
            <div className="flex-1">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.max(20, 100 - (parseFloat(swim.pace) - 2.0) * 120)}%`,
                  }}
                />
              </div>
            </div>
            <span className="w-12 text-xs font-bold tabular-nums">{swim.pace}</span>
            <span className="w-14 text-xs text-muted-foreground tabular-nums">{swim.duration}</span>
            {swim.hr && (
              <span className="w-16 text-xs text-muted-foreground tabular-nums">
                {swim.hr} bpm
              </span>
            )}
            {i === 0 && (
              <span className="text-[10px] font-semibold text-primary">Latest</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
