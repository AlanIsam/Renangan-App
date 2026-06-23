import { loadActivities, loadWorkouts, getCurrentWeekPlan } from "@/lib/queries"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function Home() {
  const activities = (await loadActivities()).map((a) => ({
    ...a,
    date: a.date.toISOString(),
  }))

  const workouts = (await loadWorkouts()).map((w) => ({
    ...w,
    date: w.date.toISOString(),
  }))

  const plan = await getCurrentWeekPlan()
  const serializedPlan = plan
    ? { ...plan, weekStart: plan.weekStart.toISOString(), createdAt: plan.createdAt.toISOString() }
    : null

  return <DashboardContent activities={activities} workouts={workouts} plan={serializedPlan} />
}
