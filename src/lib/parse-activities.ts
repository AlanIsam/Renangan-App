import fs from "fs"
import path from "path"
import type { Activity } from "@/lib/activity-utils"

export type { Activity } from "@/lib/activity-utils"
export {
  type TimeRange,
  type MonthlyStats,
  filterByRange,
  getSwimActivities,
  getMonthlySwimStats,
  formatPace,
  formatDuration,
} from "@/lib/activity-utils"

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  fields.push(current.trim())
  return fields
}

function parseNumber(val: string): number | null {
  if (!val || val === "") return null
  const cleaned = val.replace(/,/g, "")
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export function loadActivities(): Activity[] {
  const uploadsDir = path.join(process.cwd(), "uploads")
  if (!fs.existsSync(uploadsDir)) return []

  const files = fs.readdirSync(uploadsDir).filter((f) => f.endsWith(".csv"))
  const allActivities: Activity[] = []

  for (const file of files) {
    const content = fs.readFileSync(path.join(uploadsDir, file), "utf-8")
    const lines = content.split("\n").filter((l) => l.trim())
    if (lines.length < 2) continue

    const headers = parseCSVLine(lines[0])
    const colIndex = (name: string) => headers.indexOf(name)

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i])
      if (fields.length < 10) continue

      const dateStr = fields[colIndex("Activity Date")]
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) continue

      const distanceRaw = parseNumber(fields[colIndex("Distance")])
      const movingTimeIdx = headers.indexOf("Moving Time", 10)
      const distanceIdx = headers.indexOf("Distance", 10)

      const actType = fields[colIndex("Activity Type")]
      const movingTime = parseNumber(fields[movingTimeIdx]) ?? 0
      const distance = parseNumber(fields[distanceIdx]) ?? distanceRaw ?? 0

      if (actType === "Swim" && distance > 0 && movingTime > 0) {
        const pacePerHundred = (movingTime / distance) * 100
        if (pacePerHundred < 110) continue
      }

      allActivities.push({
        id: fields[colIndex("Activity ID")],
        date,
        name: fields[colIndex("Activity Name")],
        type: actType,
        elapsedTime: parseNumber(fields[colIndex("Elapsed Time")]) ?? 0,
        movingTime,
        distance,
        maxHeartRate: parseNumber(fields[colIndex("Max Heart Rate")]),
        avgHeartRate: parseNumber(fields[colIndex("Average Heart Rate")]),
        calories: parseNumber(fields[colIndex("Calories")]),
        avgSpeed: parseNumber(fields[colIndex("Average Speed")]),
        poolLength: parseNumber(fields[colIndex("Pool Length")]),
      })
    }
  }

  allActivities.sort((a, b) => b.date.getTime() - a.date.getTime())
  return allActivities
}
