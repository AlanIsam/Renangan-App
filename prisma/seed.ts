import { PrismaClient } from "../src/generated/prisma/client.ts"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import fs from "fs"
import path from "path"

const adapter = new PrismaLibSql({ url: "file:dev.db" })

async function main() {
  const prisma = new PrismaClient({ adapter })

  const csvPath = path.join(process.cwd(), "uploads", "activities.csv")
  if (!fs.existsSync(csvPath)) {
    console.log("No activities.csv found in uploads/")
    return
  }

  const content = fs.readFileSync(csvPath, "utf-8")
  const lines = content.split("\n").filter((l) => l.trim())
  if (lines.length < 2) return

  const headers = parseCSVLine(lines[0])
  const colIndex = (name: string) => headers.indexOf(name)
  const movingTimeIdx = headers.indexOf("Moving Time", 10)
  const distanceIdx = headers.indexOf("Distance", 10)

  let imported = 0
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i])
    if (fields.length < 10) continue

    const dateStr = fields[colIndex("Activity Date")]
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) continue

    const actType = fields[colIndex("Activity Type")]
    const movingTime = parseNumber(fields[movingTimeIdx]) ?? 0
    const distance = parseNumber(fields[distanceIdx]) ?? parseNumber(fields[colIndex("Distance")]) ?? 0

    if (actType === "Swim" && distance > 0 && movingTime > 0) {
      const pacePerHundred = (movingTime / distance) * 100
      if (pacePerHundred < 110) { skipped++; continue }
    }

    await prisma.activity.create({
      data: {
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
        source: "csv",
      },
    })
    imported++
  }

  console.log(`Imported ${imported} activities, skipped ${skipped} anomalies`)
  await prisma.$disconnect()
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') inQuotes = !inQuotes
    else if (char === "," && !inQuotes) { fields.push(current.trim()); current = "" }
    else current += char
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

main().catch((e) => { console.error(e); process.exit(1) })
