"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Check, X, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiPost, apiPut, apiDelete } from "@/lib/api-client"
import { ConfirmModal } from "@/components/confirm-modal"

type Note = { id: string; content: string; createdAt: string }

export function TrainingNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [adding, setAdding] = useState(false)
  const [newContent, setNewContent] = useState("")
  const [editId, setEditId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchNotes = async () => {
    const res = await fetch("/api/notes")
    if (res.ok) setNotes(await res.json())
  }

  useEffect(() => { fetchNotes() }, [])

  const handleAdd = async () => {
    if (!newContent.trim()) return
    await apiPost("/api/notes", { content: newContent.trim() })
    setNewContent("")
    setAdding(false)
    fetchNotes()
  }

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return
    await apiPut(`/api/notes/${id}`, { content: editContent.trim() })
    setEditId(null)
    fetchNotes()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await apiDelete(`/api/notes/${deleteTarget.id}`)
    setDeleting(false)
    setDeleteTarget(null)
    fetchNotes()
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Training Context</h3>
          </div>
          {!adding && (
            <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Note
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          Notes here are sent to the AI when generating plans and insights.
        </p>

        {notes.length === 0 && !adding && (
          <p className="text-xs text-muted-foreground italic">
            No context notes yet. Add things like injuries, goals, or training the app doesn't track.
          </p>
        )}

        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="flex items-center gap-2 rounded-lg bg-background px-3 py-2.5">
              {editId === note.id ? (
                <>
                  <Input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="h-8 text-sm flex-1"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleEdit(note.id); if (e.key === "Escape") setEditId(null) }}
                  />
                  <button onClick={() => handleEdit(note.id)} className="p-1.5 rounded-md hover:bg-accent text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditId(null)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm flex-1">{note.content}</span>
                  <button
                    onClick={() => { setEditId(note.id); setEditContent(note.content) }}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(note)}
                    className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}

          {adding && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g. Lifeguard training 4x/week, not logged here"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="h-9 text-sm flex-1"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false) }}
              />
              <button onClick={handleAdd} className="p-1.5 rounded-md hover:bg-accent text-emerald-400">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => { setAdding(false); setNewContent("") }} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Note"
        message={deleteTarget ? `Remove "${deleteTarget.content}"?` : ""}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
