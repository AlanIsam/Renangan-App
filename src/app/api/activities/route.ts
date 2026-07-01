import { NextResponse } from "next/server"
import { createActivity } from "@/lib/queries"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const { allowed } = rateLimit("activities-create", 30, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
  }

  const body = await request.json()

  const { date, name, type, distance, movingTime, avgHeartRate, maxHeartRate, calories, poolLength, notes, splits } = body

  if (!date || !name || !type || distance == null || movingTime == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (typeof distance !== "number" || distance < 0) {
    return NextResponse.json({ error: "Invalid distance" }, { status: 400 })
  }

  if (typeof movingTime !== "number" || movingTime < 0) {
    return NextResponse.json({ error: "Invalid moving time" }, { status: 400 })
  }

  const allowedTypes = ["Swim", "Run", "Walk", "Strength"]
  if (!allowedTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid activity type" }, { status: 400 })
  }

  const activity = await createActivity({
    date: new Date(date),
    name: String(name).slice(0, 200),
    type,
    distance,
    movingTime,
    avgHeartRate: avgHeartRate ?? null,
    maxHeartRate: maxHeartRate ?? null,
    calories: calories ?? null,
    poolLength: poolLength ?? null,
    notes: notes ? String(notes).slice(0, 1000) : null,
    splits: Array.isArray(splits) ? splits.filter((s: { distance: number; time: number; stroke?: string }) => s.distance > 0 && s.time > 0) : undefined,
  })

  return NextResponse.json(activity, { status: 201 })
}
