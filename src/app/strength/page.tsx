import { loadWorkouts } from "@/lib/queries"
import { StrengthContent } from "@/components/strength/strength-content"

export default async function StrengthPage() {
  const workouts = (await loadWorkouts()).map((w) => ({
    ...w,
    date: w.date.toISOString(),
  }))

  return <StrengthContent workouts={workouts} />
}
