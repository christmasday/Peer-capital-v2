import type { Metadata } from "next"
import { getNotifications } from "@/lib/actions/notifications"
import { NotificationsClient } from "./notifications-client"

export const metadata: Metadata = {
  title: "Notifications | Peer Capital",
  description: "View your notifications",
}

export default async function NotificationsPage() {
  const { notifications = [], unreadCount = 0, error } = await getNotifications(1, 20, true)

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <NotificationsClient initialNotifications={notifications} initialUnreadCount={unreadCount} error={error} />
    </div>
  )
}
