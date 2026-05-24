import type { Metadata } from "next"
import { getNotifications } from "@/lib/actions/notifications"
import { NotificationsClient } from "./notifications-client"
import { MainLayout } from "@/components/layouts/main-layout"
import { getUserProfile } from "@/lib/actions/auth"

export const metadata: Metadata = {
  title: "Notifications | Peer Capital",
  description: "View your notifications",
}

export default async function NotificationsPage() {
  const userProfile = await getUserProfile()
  const { notifications = [], unreadCount = 0, error } = await getNotifications(1, 20, true)

  return (
    <MainLayout userName={userProfile.profile?.username ? `@${userProfile.profile.username}` : `${userProfile.profile?.first_name || ""} ${userProfile.profile?.last_name || ""}`.trim() || "User"} userImage={userProfile.profile?.profile_picture_url}>
      <div className="container max-w-3xl mx-auto py-10">
        <div className="mx-auto">
          <NotificationsClient initialNotifications={notifications} initialUnreadCount={unreadCount} error={error} />
        </div>
      </div>
    </MainLayout>
  )
}
