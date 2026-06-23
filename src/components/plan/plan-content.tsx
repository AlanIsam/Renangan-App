"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlanCalendar } from "@/components/plan/plan-calendar"
import { apiPost } from "@/lib/api-client"
import type { PlanWithDays } from "@/lib/queries"

type SerializedPlan = Omit<PlanWithDays, "createdAt" | "weekStart"> & { createdAt: string; weekStart: string }

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
  Swim: { bg: "bg-sky-950/50", text: "text-sky-400", border: "border-sky-800/50" },
  Gym: { bg: "bg-emerald-950/50", text: "text-emerald-400", border: "border-emerald-800/50" },
  Run: { bg: "bg-orange-950/50", text: "text-orange-400", border: "border-orange-800/50" },
  Rest: { bg: "bg-zinc-900/50", text: "text-zinc-500", border: "border-zinc-800/50" },
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

function formatWeekRange(weekStartStr: string): string {
  const start = new Date(weekStartStr)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  return `${start.toLocaleDateString("en-AU", opts)} – ${end.toLocaleDateString("en-AU", opts)}`
}

export function PlanContent({ currentPlan, allPlans }: { currentPlan: SerializedPlan | null; allPlans: SerializedPlan[] }) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [error, setError] = useState("")

  const today = new Date().getDay()
  const todayIdx = today === 0 ? 6 : today - 1

  const todayPlan = currentPlan?.days.find((d) => d.dayOfWeek === todayIdx)

  const handleGenerate = async () => {
    setError("")
    setGenerating(true)

    try {
      const res = await apiPost("/api/plan", { prompt: prompt || undefined })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to generate plan")
        setGenerating(false)
        return
      }

      setShowPrompt(false)
      setPrompt("")
      setGenerating(false)
      router.refresh()
    } catch {
      setError("Failed to connect to AI")
      setGenerating(false)
    }
  }

  const pastPlans = allPlans.filter((p) => currentPlan ? p.id !== currentPlan.id : true)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workout Plan</h1>
          {currentPlan ? (
            <p className="text-sm text-muted-foreground mt-1">
              {currentPlan.name} &middot; Week of {formatWeekRange(currentPlan.weekStart)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              No plan for this week — generate one with AI
            </p>
          )}
        </div>

        <Button
          onClick={() => setShowPrompt(!showPrompt)}
          className="h-11 gap-2 px-5 py-5 text-lg"
          disabled={generating}
        >
          {generating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          {currentPlan ? "Regenerate" : "Generate Plan"}
        </Button>
      </div>

      {/* AI Prompt Modal */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPrompt(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-2">
              {currentPlan ? "Regenerate This Week's Plan" : "Generate Training Plan"}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              The AI will analyze your recent swims and workouts to create a personalized plan for this week.
              {currentPlan && " This will replace the current plan."}
            </p>
            <Input
              placeholder="e.g. Focus on endurance, I have a groin injury, add more core work..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-11 text-base mb-4"
            />
            {error && <p className="text-sm text-destructive mb-4">{error}</p>}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="lg" onClick={() => setShowPrompt(false)}>
                Cancel
              </Button>
              <Button size="lg" onClick={handleGenerate} disabled={generating} className="gap-2">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Workout */}
      {todayPlan && (
        <div className={`rounded-xl border ${typeStyles[todayPlan.type]?.border ?? "border-border"} ${typeStyles[todayPlan.type]?.bg ?? "bg-card"} p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{typeIcons[todayPlan.type] ?? "📋"}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Today — {DAY_NAMES[todayIdx]}</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${typeStyles[todayPlan.type]?.text ?? ""} bg-black/20`}>
                  {todayPlan.type.toUpperCase()}
                </span>
              </div>
              <p className={`text-sm font-medium ${typeStyles[todayPlan.type]?.text ?? "text-muted-foreground"}`}>
                {todayPlan.focus}
              </p>
            </div>
          </div>

          {todayPlan.notes && (
            <p className="text-sm text-muted-foreground mb-4 italic">{todayPlan.notes}</p>
          )}

          <div className="space-y-2">
            {todayPlan.items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-lg bg-black/20 px-4 py-3">
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

      {/* No plan state */}
      {!currentPlan && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Plan for This Week</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Click "Generate Plan" to let AI create a personalized weekly training plan based on your swim and strength data.
          </p>
        </div>
      )}

      {/* Calendar View */}
      {currentPlan && (
        <PlanCalendar plan={{ ...currentPlan, weekStart: new Date(currentPlan.weekStart), createdAt: new Date(currentPlan.createdAt) }} />
      )}

      {/* Past Plans */}
      {pastPlans.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Past Plans</h3>
          {pastPlans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  Week of {formatWeekRange(plan.weekStart)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {plan.days.map((d) => typeIcons[d.type] ?? "").join(" ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
