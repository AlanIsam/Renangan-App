"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiPut } from "@/lib/api-client"
import { SWIM_STROKES, type Activity } from "@/lib/activity-utils"

type SplitEntry = { distance: string; minutes: string; seconds: string; stroke: string }

type EditSwimFormProps = {
  swim: Activity
  onClose: () => void
}

export function EditSwimForm({ swim, onClose }: EditSwimFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const hasSplits = swim.splits && swim.splits.length > 0
  const [useSplits, setUseSplits] = useState(hasSplits)

  const [form, setForm] = useState({
    date: swim.date.toISOString().split("T")[0],
    name: swim.name,
    distance: String(swim.distance),
    minutes: String(Math.floor(swim.movingTime / 60)),
    seconds: String(Math.round(swim.movingTime % 60)),
    avgHeartRate: swim.avgHeartRate ? String(swim.avgHeartRate) : "",
    poolLength: swim.poolLength ? String(swim.poolLength) : "50",
    notes: swim.notes ?? "",
  })

  const [splits, setSplits] = useState<SplitEntry[]>(
    hasSplits
      ? swim.splits!.map((s) => ({
          distance: String(s.distance),
          minutes: String(Math.floor(s.time / 60)),
          seconds: String(Math.round(s.time % 60)),
          stroke: s.stroke ?? "Freestyle",
        }))
      : [{ distance: "", minutes: "", seconds: "", stroke: "Freestyle" }]
  )

  const addSplit = () => setSplits([...splits, { distance: "", minutes: "", seconds: "", stroke: "Freestyle" }])
  const removeSplit = (idx: number) => {
    if (splits.length <= 1) return
    setSplits(splits.filter((_, i) => i !== idx))
  }
  const updateSplit = (idx: number, field: keyof SplitEntry, value: string) => {
    const updated = [...splits]
    updated[idx] = { ...updated[idx], [field]: value }
    setSplits(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    let distance: number
    let movingTime: number
    let parsedSplits: { distance: number; time: number; stroke: string }[] | undefined

    if (useSplits) {
      parsedSplits = splits.map((s) => ({
        distance: parseFloat(s.distance) || 0,
        time: ((parseInt(s.minutes) || 0) * 60) + (parseInt(s.seconds) || 0),
        stroke: s.stroke,
      })).filter((s) => s.distance > 0 && s.time > 0)

      if (parsedSplits.length === 0) { setError("Add at least one valid split"); setSaving(false); return }

      distance = parsedSplits.reduce((sum, s) => sum + s.distance, 0)
      movingTime = parsedSplits.reduce((sum, s) => sum + s.time, 0)
    } else {
      distance = parseFloat(form.distance)
      const mins = parseInt(form.minutes) || 0
      const secs = parseInt(form.seconds) || 0
      movingTime = mins * 60 + secs
      parsedSplits = []
    }

    if (!distance || distance <= 0) { setError("Enter a valid distance"); setSaving(false); return }
    if (movingTime <= 0) { setError("Enter a valid duration"); setSaving(false); return }

    const res = await apiPut(`/api/activities/${swim.id}`, {
      date: form.date,
      name: form.name || "Swim Session",
      distance,
      movingTime,
      avgHeartRate: form.avgHeartRate ? parseFloat(form.avgHeartRate) : null,
      poolLength: form.poolLength ? parseFloat(form.poolLength) : null,
      notes: form.notes || null,
      splits: parsedSplits,
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

  const splitTotalDist = splits.reduce((s, sp) => s + (parseFloat(sp.distance) || 0), 0)
  const splitTotalTime = splits.reduce((s, sp) => s + ((parseInt(sp.minutes) || 0) * 60) + (parseInt(sp.seconds) || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-8 shadow-2xl">
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

          {/* Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUseSplits(false)}
              className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${!useSplits ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}
            >
              Total Distance
            </button>
            <button
              type="button"
              onClick={() => setUseSplits(true)}
              className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${useSplits ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}
            >
              By Splits
            </button>
          </div>

          {!useSplits ? (
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
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold">Splits</label>
                <Button type="button" variant="outline" size="sm" onClick={addSplit} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add Split
                </Button>
              </div>
              <div className="space-y-2">
                {splits.map((split, idx) => (
                  <div key={idx} className="rounded-lg border border-border bg-background p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground w-5">{idx + 1}.</span>
                      <div className="flex-1">
                        <label className="text-[10px] text-muted-foreground">Dist (m)</label>
                        <Input type="number" placeholder="200" value={split.distance} onChange={(e) => updateSplit(idx, "distance", e.target.value)} min="0" step="25" className="h-9" />
                      </div>
                      <div className="w-20">
                        <label className="text-[10px] text-muted-foreground">Min</label>
                        <Input type="number" placeholder="4" value={split.minutes} onChange={(e) => updateSplit(idx, "minutes", e.target.value)} min="0" className="h-9" />
                      </div>
                      <div className="w-20">
                        <label className="text-[10px] text-muted-foreground">Sec</label>
                        <Input type="number" placeholder="30" value={split.seconds} onChange={(e) => updateSplit(idx, "seconds", e.target.value)} min="0" max="59" className="h-9" />
                      </div>
                      {splits.length > 1 && (
                        <button type="button" onClick={() => removeSplit(idx)} className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive mt-4">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="pl-7">
                      <label className="text-[10px] text-muted-foreground mb-1 block">Stroke</label>
                      <select
                        value={split.stroke}
                        onChange={(e) => updateSplit(idx, "stroke", e.target.value)}
                        className="h-8 rounded-md border border-border bg-background px-2 text-xs w-full"
                      >
                        {SWIM_STROKES.map((stroke) => (
                          <option key={stroke} value={stroke}>{stroke}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Total: {splitTotalDist}m &middot; {Math.floor(splitTotalTime / 60)}m {splitTotalTime % 60}s
              </p>
            </div>
          )}

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

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Session Notes (optional)</label>
            <textarea
              placeholder="e.g. S1-S3 easy warmup, S4-S6 max effort with fins, S7 recovery felt heavy legs"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
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
