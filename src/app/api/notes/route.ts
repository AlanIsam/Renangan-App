import { NextResponse } from "next/server"
import { loadTrainingNotes, createTrainingNote } from "@/lib/queries"

export async function GET() {
  const notes = await loadTrainingNotes()
  return NextResponse.json(notes)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { content } = body

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  const note = await createTrainingNote(content.trim().slice(0, 500))
  return NextResponse.json(note, { status: 201 })
}
