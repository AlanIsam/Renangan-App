"use client"

import { useState } from "react"
import { Brain, Loader2, TrendingUp, AlertTriangle, Info, Lightbulb, Waves, Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiPost } from "@/lib/api-client"
import type { InsightReport } from "@/lib/gemini"

const typeIcon = {
  positive: <TrendingUp className="h-4 w-4 text-emerald-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  neutral: <Info className="h-4 w-4 text-sky-400" />,
}

const typeBg = {
  positive: "border-emerald-800/50 bg-emerald-950/30",
  warning: "border-amber-800/50 bg-amber-950/30",
  neutral: "border-sky-800/50 bg-sky-950/30",
}

export function AIInsights() {
  const [report, setReport] = useState<InsightReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGenerate = async () => {
    setError("")
    setLoading(true)

    try {
      const res = await apiPost("/api/insights", {})

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to generate insights")
        setLoading(false)
        return
      }

      const data = await res.json()
      setReport(data)
      setLoading(false)
    } catch {
      setError("Failed to connect to AI")
      setLoading(false)
    }
  }

  if (!report) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-sm font-semibold mb-1">AI Training Analysis</h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
          Get data-driven insights on your swim and strength progress
        </p>
        {error && <p className="text-xs text-destructive mb-3">{error}</p>}
        <Button onClick={handleGenerate} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          {loading ? "Analyzing..." : "Analyze My Progress"}
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">AI Training Analysis</h3>
        </div>
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
          {loading ? "Analyzing..." : "Refresh"}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{report.overall}</p>

      {report.swim.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Waves className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Swimming</span>
          </div>
          <div className="space-y-2">
            {report.swim.map((insight, i) => (
              <div key={i} className={`rounded-lg border p-3 ${typeBg[insight.type]}`}>
                <div className="flex items-center gap-2 mb-1">
                  {typeIcon[insight.type]}
                  <span className="text-sm font-medium">{insight.title}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">{insight.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.strength.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Strength</span>
          </div>
          <div className="space-y-2">
            {report.strength.map((insight, i) => (
              <div key={i} className={`rounded-lg border p-3 ${typeBg[insight.type]}`}>
                <div className="flex items-center gap-2 mb-1">
                  {typeIcon[insight.type]}
                  <span className="text-sm font-medium">{insight.title}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">{insight.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommendations</span>
          </div>
          <div className="space-y-1.5">
            {report.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground shrink-0 mt-0.5">{i + 1}.</span>
                <span className="text-muted-foreground">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
