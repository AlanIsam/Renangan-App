export const SWIM_STROKES = ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Mixed", "Drill", "Kick"] as const
export type SwimStroke = typeof SWIM_STROKES[number]

export type SwimSplit = {
  id: string
  distance: number
  time: number
  stroke: string | null
  orderIdx: number
}

export type Activity = {
  id: string
  date: Date
  name: string
  type: "Swim" | "Run" | "Walk" | string
  elapsedTime: number
  movingTime: number
  distance: number
  maxHeartRate: number | null
  avgHeartRate: number | null
  calories: number | null
  avgSpeed: number | null
  poolLength: number | null
  splits?: SwimSplit[]
}

export type TimeRange = "3m" | "6m" | "1y" | "all"

export type MonthlyStats = {
  month: string
  label: string
  avgPace: number
  bestPace: number
  sessions: number
  distanceKm: number
  avgHeartRate: number | null
}

export function filterByRange(activities: Activity[], range: TimeRange): Activity[] {
  if (range === "all") return activities
  const now = new Date()
  const cutoff = new Date(now)
  if (range === "3m") cutoff.setMonth(now.getMonth() - 3)
  else if (range === "6m") cutoff.setMonth(now.getMonth() - 6)
  else if (range === "1y") cutoff.setFullYear(now.getFullYear() - 1)
  return activities.filter((a) => a.date >= cutoff)
}

export function getSwimActivities(activities: Activity[]): Activity[] {
  return activities.filter((a) => a.type === "Swim")
}

export function formatPace(distanceMeters: number, timeSeconds: number): string {
  if (distanceMeters <= 0 || timeSeconds <= 0) return "--"
  const per100m = (timeSeconds / distanceMeters) * 100
  const mins = Math.floor(per100m / 60)
  const secs = Math.round(per100m % 60)
  return `${mins}:${String(secs).padStart(2, "0")}`
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.round(seconds % 60)
  if (hrs > 0) return `${hrs}h ${mins}m`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

export function getMonthlySwimStats(swims: Activity[]): MonthlyStats[] {
  const grouped = new Map<string, Activity[]>()

  for (const swim of swims) {
    const key = `${swim.date.getFullYear()}-${String(swim.date.getMonth() + 1).padStart(2, "0")}`
    const existing = grouped.get(key) ?? []
    existing.push(swim)
    grouped.set(key, existing)
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, activities]) => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const [year, month] = key.split("-")
      const monthIdx = parseInt(month) - 1
      const shortYear = year.slice(2)

      const paces = activities
        .filter((a) => a.distance > 0 && a.movingTime > 0)
        .map((a) => (a.movingTime / a.distance) * 100)

      const heartRates = activities
        .map((a) => a.avgHeartRate)
        .filter((hr): hr is number => hr !== null && hr > 0)

      return {
        month: `${monthNames[monthIdx]} '${shortYear}`,
        label: `${monthNames[monthIdx]} ${shortYear}`,
        avgPace: paces.length > 0 ? paces.reduce((a, b) => a + b, 0) / paces.length : 0,
        bestPace: paces.length > 0 ? Math.min(...paces) : 0,
        sessions: activities.length,
        distanceKm: activities.reduce((sum, a) => sum + a.distance, 0) / 1000,
        avgHeartRate: heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : null,
      }
    })
}
