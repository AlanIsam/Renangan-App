export const dynamic = "force-dynamic"

import { loadSwimActivities } from "@/lib/queries"
import { SwimmingContent } from "@/components/swimming/swimming-content"

export default async function SwimmingPage() {
  const swims = (await loadSwimActivities()).map((a) => ({
    ...a,
    date: a.date.toISOString(),
  }))

  return <SwimmingContent swims={swims} />
}
