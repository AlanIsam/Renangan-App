import { NextResponse } from "next/server"
import { deleteActivity, updateActivity } from "@/lib/queries"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })

  try {
    await deleteActivity(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })

  const body = await request.json()
  const { date, name, distance, movingTime, avgHeartRate, poolLength } = body

  if (!date || !name || distance == null || movingTime == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const updated = await updateActivity(id, {
      date: new Date(date),
      name: String(name).slice(0, 200),
      distance,
      movingTime,
      avgHeartRate: avgHeartRate ?? null,
      poolLength: poolLength ?? null,
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 })
  }
}
