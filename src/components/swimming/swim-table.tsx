"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUpDown, ChevronLeft, ChevronRight, Trash2, Pencil, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmModal } from "@/components/confirm-modal"
import { EditSwimForm } from "@/components/swimming/edit-swim-form"
import { apiDelete } from "@/lib/api-client"
import { type Activity, formatPace, formatDuration } from "@/lib/activity-utils"

type SortKey = "date" | "distance" | "pace" | "movingTime" | "avgHeartRate"
type SortDir = "asc" | "desc"

const PER_PAGE = 10

function getPace(s: Activity): number {
  if (s.distance <= 0 || s.movingTime <= 0) return Infinity
  return (s.movingTime / s.distance) * 100
}

const columns = [
  { key: "date" as SortKey, label: "Date", width: "w-28" },
  { key: null, label: "Name", width: "flex-1" },
  { key: "distance" as SortKey, label: "Distance", width: "w-24" },
  { key: "movingTime" as SortKey, label: "Duration", width: "w-24" },
  { key: "pace" as SortKey, label: "Pace/100m", width: "w-24" },
  { key: "avgHeartRate" as SortKey, label: "Avg HR", width: "w-20" },
]

export function SwimTable({ swims }: { swims: Activity[] }) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editTarget, setEditTarget] = useState<Activity | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await apiDelete(`/api/activities/${deleteTarget.id}`)
    setDeleting(false)
    setDeleteTarget(null)
    router.refresh()
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir(key === "date" ? "desc" : "asc")
    }
    setPage(0)
  }

  const sorted = [...swims].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case "date":
        cmp = a.date.getTime() - b.date.getTime()
        break
      case "distance":
        cmp = a.distance - b.distance
        break
      case "pace":
        cmp = getPace(a) - getPace(b)
        break
      case "movingTime":
        cmp = a.movingTime - b.movingTime
        break
      case "avgHeartRate":
        cmp = (a.avgHeartRate ?? 0) - (b.avgHeartRate ?? 0)
        break
    }
    return sortDir === "asc" ? cmp : -cmp
  })

  const totalPages = Math.ceil(sorted.length / PER_PAGE)
  const pageSwims = sorted.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  return (
    <>
    <div className="rounded-xl border border-border bg-card">
      <div className="p-5 pb-3">
        <h3 className="text-lg font-semibold">All Swim Sessions</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {swims.length} sessions
        </p>
      </div>

      {/* Sort controls for mobile */}
      <div className="flex gap-2 px-5 pb-3 md:hidden flex-wrap">
        {columns.filter((c) => c.key).map((col) => (
          <button
            key={col.key}
            onClick={() => col.key && handleSort(col.key)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
              sortKey === col.key
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {col.label} {sortKey === col.key && (sortDir === "asc" ? "↑" : "↓")}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex items-center gap-2 px-5 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {columns.map((col, i) => (
              <div key={i} className={`${col.width} ${col.key ? "cursor-pointer hover:text-foreground select-none" : ""}`}
                onClick={() => col.key && handleSort(col.key)}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.key && sortKey === col.key && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="divide-y divide-border">
            {pageSwims.map((swim, i) => (
              <div key={swim.id || i} className="flex items-center gap-2 px-5 py-2.5 text-sm hover:bg-accent/50">
                <div className="w-28 text-xs text-muted-foreground">
                  {swim.date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "2-digit" })}
                </div>
                <div className="flex-1 text-sm font-medium truncate">
                  {swim.name}
                </div>
                <div className="w-24 text-sm tabular-nums">
                  {swim.distance >= 1000 ? `${(swim.distance / 1000).toFixed(1)}km` : `${swim.distance}m`}
                </div>
                <div className="w-24 text-sm tabular-nums text-muted-foreground">
                  {formatDuration(swim.movingTime)}
                </div>
                <div className="w-24 text-sm font-bold tabular-nums">
                  {formatPace(swim.distance, swim.movingTime)}
                </div>
                <div className="w-20 text-sm tabular-nums text-muted-foreground">
                  {swim.avgHeartRate ? `${swim.avgHeartRate} bpm` : "--"}
                </div>
                <button onClick={() => setEditTarget(swim)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(swim)} className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border">
        {pageSwims.map((swim, i) => {
          const hasSplits = swim.splits && swim.splits.length > 0
          const isExpanded = expandedId === swim.id
          return (
            <div key={swim.id || i} className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1" onClick={() => hasSplits && setExpandedId(isExpanded ? null : swim.id)}>
                  <p className="text-sm font-medium">
                    {swim.name}
                    {hasSplits && <span className="text-[10px] text-muted-foreground ml-2">{swim.splits!.length} splits</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {swim.date.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "2-digit" })}
                  </p>
                </div>
                <div className="flex gap-1">
                  {hasSplits && (
                    <button onClick={() => setExpandedId(isExpanded ? null : swim.id)} className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors">
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  )}
                  <button onClick={() => setEditTarget(swim)} className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(swim)} className="p-2 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Distance</p>
                  <p className="text-sm font-medium tabular-nums">
                    {swim.distance >= 1000 ? `${(swim.distance / 1000).toFixed(1)}km` : `${swim.distance}m`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
                  <p className="text-sm tabular-nums">{formatDuration(swim.movingTime)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Pace</p>
                  <p className="text-sm font-bold tabular-nums">{formatPace(swim.distance, swim.movingTime)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">HR</p>
                  <p className="text-sm tabular-nums">{swim.avgHeartRate ? `${swim.avgHeartRate}` : "--"}</p>
                </div>
              </div>
              {isExpanded && swim.splits && (
                <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Splits</p>
                  {swim.splits.map((split, si) => (
                    <div key={split.id} className="flex items-center gap-3 rounded-md bg-background px-3 py-2 text-xs">
                      <span className="text-muted-foreground w-4">{si + 1}.</span>
                      <span className="font-medium w-14">{split.distance}m</span>
                      <span className="text-muted-foreground w-14">{formatDuration(split.time)}</span>
                      <span className="font-bold">{formatPace(split.distance, split.time)}/100m</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, sorted.length)} of {sorted.length}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0} className="h-7 w-7 p-0">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1} className="h-7 w-7 p-0">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Swim Session"
        message={deleteTarget ? `Remove "${deleteTarget.name}" on ${deleteTarget.date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "2-digit" })}? This cannot be undone.` : ""}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {editTarget && (
        <EditSwimForm swim={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </>
  )
}
