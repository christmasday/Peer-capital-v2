import { checkAuth } from "@/lib/auth-utils"
import { getCurrentUserId } from "@/lib/auth-utils"
import { ActivityTimeline } from "@/components/profile/activity-timeline"

export default async function ProfileActivityLogPage() {
  await checkAuth("/login?redirect=/profile/activity-log")
  const userId = await getCurrentUserId()

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Activity Log</h1>
      {userId && <ActivityTimeline userId={userId} />}
    </div>
  )
}


