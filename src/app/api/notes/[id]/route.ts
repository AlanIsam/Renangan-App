import { NextResponse } from "next/server"
import { updateTrainingNote, deleteTrainingNote } from "@/lib/queries"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { content } = body

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  try {
    const note = await updateTrainingNote(id, content.trim().slice(0, 500))
    return NextResponse.json(note)
  } catch {
    return NextResponse.json({ error: "Note not found" }, { status: 404 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await deleteTrainingNote(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Note not found" }, { status: 404 })
  }
}
