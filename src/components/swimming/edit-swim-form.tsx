"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiPut } from "@/lib/api-client"
import type { Activity } from "@/lib/activity-utils"

type EditSwimFormProps = {
  swim: Activity
  onClose: () => void
}

export function EditSwimForm({ swim, onClose }: EditSwimFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    date: swim.date.toISOString().split("T")[0],
    name: swim.name,
    distance: String(swim.distance),
    minutes: String(Math.floor(swim.movingTime / 60)),
    seconds: String(Math.round(swim.movingTime % 60)),
    avgHeartRate: swim.avgHeartRate ? String(swim.avgHeartRate) : "",
    poolLength: swim.poolLength ? String(swim.poolLength) : "50",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    const distance = parseFloat(form.distance)
    const mins = parseInt(form.minutes) || 0
    const secs = parseInt(form.seconds) || 0
    const movingTime = mins * 60 + secs

    if (!distance || distance <= 0) { setError("Enter a valid distance"); setSaving(false); return }
    if (movingTime <= 0) { setError("Enter a valid duration"); setSaving(false); return }

    const res = await apiPut(`/api/activities/${swim.id}`, {
      date: form.date,
      name: form.name || "Swim Session",
      distance,
      movingTime,
      avgHeartRate: form.avgHeartRate ? parseFloat(form.avgHeartRate) : null,
      poolLength: form.poolLength ? parseFloat(form.poolLength) : null,
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to save")
      setSaving(false)
      return
    }

    setSaving(false)
    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Edit Swim Session</h3>
          <Button variant="ghost" size="icon-lg" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Date</label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-11 text-base" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Session Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 text-base" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Distance (m)</label>
              <Input type="number" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} min="0" step="25" className="h-11 text-base" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Duration (min)</label>
              <Input type="number" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} min="0" className="h-11 text-base" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Duration (sec)</label>
              <Input type="number" value={form.seconds} onChange={(e) => setForm({ ...form, seconds: e.target.value })} min="0" max="59" className="h-11 text-base" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Avg Heart Rate</label>
              <Input type="number" value={form.avgHeartRate} onChange={(e) => setForm({ ...form, avgHeartRate: e.target.value })} min="0" max="250" className="h-11 text-base" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Pool Length (m)</label>
              <Input type="number" value={form.poolLength} onChange={(e) => setForm({ ...form, poolLength: e.target.value })} min="0" className="h-11 text-base" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" size="lg" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="lg" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
