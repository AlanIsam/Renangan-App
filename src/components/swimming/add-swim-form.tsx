"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AddSwimForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const today = new Date().toISOString().split("T")[0]

  const [form, setForm] = useState({
    date: today,
    name: "",
    distance: "",
    minutes: "",
    seconds: "",
    avgHeartRate: "",
    poolLength: "50",
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

    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        name: form.name || "Swim Session",
        type: "Swim",
        distance,
        movingTime,
        avgHeartRate: form.avgHeartRate ? parseFloat(form.avgHeartRate) : null,
        poolLength: form.poolLength ? parseFloat(form.poolLength) : null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to save")
      setSaving(false)
      return
    }

    setForm({ date: today, name: "", distance: "", minutes: "", seconds: "", avgHeartRate: "", poolLength: "50" })
    setOpen(false)
    setSaving(false)
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="h-11 gap-2 px-5 py-5 text-lg font-base">
        <Plus className="h-5 w-5" />
        Add Swim
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Add Swim Session</h3>
              <Button variant="ghost" size="icon-lg" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Date</label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    max={today}
                    className="h-11 text-base"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Session Name</label>
                  <Input
                    placeholder="e.g. Morning Swim"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-11 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Distance (m)</label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={form.distance}
                    onChange={(e) => setForm({ ...form, distance: e.target.value })}
                    min="0"
                    step="25"
                    className="h-11 text-base"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Duration (min)</label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={form.minutes}
                    onChange={(e) => setForm({ ...form, minutes: e.target.value })}
                    min="0"
                    className="h-11 text-base"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Duration (sec)</label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={form.seconds}
                    onChange={(e) => setForm({ ...form, seconds: e.target.value })}
                    min="0"
                    max="59"
                    className="h-11 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Avg Heart Rate (optional)</label>
                  <Input
                    type="number"
                    placeholder="140"
                    value={form.avgHeartRate}
                    onChange={(e) => setForm({ ...form, avgHeartRate: e.target.value })}
                    min="0"
                    max="250"
                    className="h-11 text-base"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Pool Length (m)</label>
                  <Input
                    type="number"
                    value={form.poolLength}
                    onChange={(e) => setForm({ ...form, poolLength: e.target.value })}
                    min="0"
                    className="h-11 text-base"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" size="lg" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="lg" disabled={saving}>
                  {saving ? "Saving..." : "Save Swim"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
