import { NextResponse } from "next/server"
import { deletePlan } from "@/lib/queries"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })

  try {
    await deletePlan(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  }
}
