import { getCurrentWeekPlan, getAllPlans } from "@/lib/queries"
import { PlanContent } from "@/components/plan/plan-content"

export default async function PlanPage() {
  const currentPlan = await getCurrentWeekPlan()
  const allPlans = await getAllPlans()

  const serialized = {
    currentPlan: currentPlan ? { ...currentPlan, weekStart: currentPlan.weekStart.toISOString(), createdAt: currentPlan.createdAt.toISOString() } : null,
    allPlans: allPlans.map((p) => ({ ...p, weekStart: p.weekStart.toISOString(), createdAt: p.createdAt.toISOString() })),
  }

  return <PlanContent currentPlan={serialized.currentPlan} allPlans={serialized.allPlans} />
}
