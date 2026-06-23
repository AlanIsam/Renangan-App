"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PlanWithDays } from "@/lib/queries"

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const typeColors: Record<string, { dot: string; bg: string; text: string }> = {
  Swim: { dot: "bg-sky-400", bg: "bg-sky-950/50", text: "text-sky-400" },
  Gym: { dot: "bg-emerald-400", bg: "bg-emerald-950/50", text: "text-emerald-400" },
  Run: { dot: "bg-orange-400", bg: "bg-orange-950/50", text: "text-orange-400" },
  Rest: { dot: "bg-zinc-600", bg: "bg-zinc-900/50", text: "text-zinc-500" },
}

const tagColors: Record<string, string> = {
  Warmup: "bg-sky-900/40 text-sky-400",
  Cooldown: "bg-sky-900/40 text-sky-400",
  Drill: "bg-indigo-900/40 text-indigo-400",
  Speed: "bg-purple-900/40 text-purple-400",
  Endurance: "bg-emerald-900/40 text-emerald-400",
  Pace: "bg-emerald-900/40 text-emerald-400",
  "Main Set": "bg-amber-900/40 text-amber-400",
  Back: "bg-emerald-900/40 text-emerald-400",
  Chest: "bg-pink-900/40 text-pink-400",
  Shoulders: "bg-violet-900/40 text-violet-400",
  Arms: "bg-amber-900/40 text-amber-400",
  Legs: "bg-orange-900/40 text-orange-400",
  Core: "bg-teal-900/40 text-teal-400",
  Recovery: "bg-slate-800/40 text-slate-400",
  Prehab: "bg-cyan-900/40 text-cyan-400",
  Cardio: "bg-yellow-900/40 text-yellow-400",
  Optional: "bg-zinc-800/40 text-zinc-500",
}

const typeIcons: Record<string, string> = {
  Swim: "🏊",
  Gym: "💪",
  Run: "🏃",
  Rest: "😴",
}

type PlanDay = PlanWithDays["days"][number]

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1

  const days: (number | null)[] = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)

  return days
}

function isInPlanWeek(year: number, month: number, day: number, weekStart: Date): boolean {
  const date = new Date(year, month, day)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return date >= weekStart && date <= weekEnd
}

function getDayOfWeek(year: number, month: number, day: number): number {
  const d = new Date(year, month, day).getDay()
  return d === 0 ? 6 : d - 1
}

export function PlanCalendar({ plan }: { plan: PlanWithDays }) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<PlanDay | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const todayDate = now.getDate()
  const todayMonth = now.getMonth()
  const todayYear = now.getFullYear()

  const weekStart = new Date(plan.weekStart)
  weekStart.setHours(0, 0, 0, 0)

  const monthDays = getMonthDays(viewYear, viewMonth)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  const handleDayClick = (day: number) => {
    if (!isInPlanWeek(viewYear, viewMonth, day, weekStart)) return

    const dow = getDayOfWeek(viewYear, viewMonth, day)
    const planDay = plan.days.find((d) => d.dayOfWeek === dow) ?? null
    const dateStr = `${day} ${MONTH_NAMES[viewMonth].slice(0, 3)} ${viewYear}`

    if (selectedDate === dateStr) {
      setSelectedDay(null)
      setSelectedDate(null)
    } else {
      setSelectedDay(planDay)
      setSelectedDate(dateStr)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-5">
          <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-base font-semibold">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, i) => {
            if (day === null) return <div key={i} />

            const inPlanWeek = isInPlanWeek(viewYear, viewMonth, day, weekStart)
            const dow = getDayOfWeek(viewYear, viewMonth, day)
            const planDay = inPlanWeek ? plan.days.find((d) => d.dayOfWeek === dow) : null
            const color = planDay ? typeColors[planDay.type] : null
            const isToday = day === todayDate && viewMonth === todayMonth && viewYear === todayYear
            const dateStr = `${day} ${MONTH_NAMES[viewMonth].slice(0, 3)} ${viewYear}`
            const isSelected = selectedDate === dateStr

            return (
              <button
                key={i}
                onClick={() => handleDayClick(day)}
                disabled={!inPlanWeek}
                className={`
                  relative flex flex-col items-center justify-center rounded-lg py-2.5 transition-colors
                  ${inPlanWeek ? "cursor-pointer" : "cursor-default opacity-40"}
                  ${isSelected ? (color?.bg ?? "bg-accent") + " ring-1 ring-primary" : inPlanWeek ? "hover:bg-accent/30" : ""}
                  ${isToday ? "ring-2 ring-primary" : ""}
                `}
              >
                <span className={`text-sm font-medium ${isToday ? "text-primary font-bold" : inPlanWeek ? "text-foreground" : "text-muted-foreground"}`}>
                  {day}
                </span>
                {planDay && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${color?.dot ?? "bg-muted"}`} />
                    <span className={`text-[9px] font-medium ${color?.text ?? "text-muted-foreground"}`}>
                      {planDay.type}
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-3 border-t border-border justify-center">
          {Object.entries(typeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${color.dot}`} />
              <span className="text-xs text-muted-foreground">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && selectedDate && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{typeIcons[selectedDay.type] ?? "📋"}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">{selectedDate}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${typeColors[selectedDay.type]?.text ?? ""} bg-black/20`}>
                  {selectedDay.type.toUpperCase()}
                </span>
              </div>
              <p className={`text-sm font-medium ${typeColors[selectedDay.type]?.text ?? "text-muted-foreground"}`}>
                {selectedDay.focus}
              </p>
            </div>
          </div>

          {selectedDay.notes && (
            <p className="text-sm text-muted-foreground mb-4 italic">{selectedDay.notes}</p>
          )}

          <div className="space-y-2">
            {selectedDay.items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-lg bg-background px-4 py-3">
                {item.tag && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 mt-0.5 ${tagColors[item.tag] ?? "bg-muted text-muted-foreground"}`}>
                    {item.tag}
                  </span>
                )}
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  {item.detail && <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
