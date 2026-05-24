"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getUnreadNotificationsCount } from "@/lib/actions/notifications"
import { useNotificationRealtime } from "@/hooks/use-notification-realtime"

interface NotificationBadgeProps {
  className?: string
}

export function NotificationBadge({ className }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUnreadCount = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getUnreadNotificationsCount()

      if (result.success && result.count !== undefined) {
        setUnreadCount(result.count)
      } else if (result.error) {
        setError(result.error)
      }
    } catch (error) {
      setError("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const { isRealtimeConnected } = useNotificationRealtime(() => {
    void fetchUnreadCount()
  })

  useEffect(() => {
    void fetchUnreadCount()
  }, [])

  useEffect(() => {
    if (isRealtimeConnected) {
      return
    }

    const intervalId = setInterval(() => {
      void fetchUnreadCount()
    }, 300000)

    return () => clearInterval(intervalId)
  }, [isRealtimeConnected])

  return (
    <div className={`relative ${className || ""}`}>
      <Bell className="h-5 w-5 transition-all duration-300 group-hover:fill-yellow-500 group-hover:text-yellow-500" />
      {!loading && !error && unreadCount > 0 && (
        <Badge
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white"
          variant="destructive"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </div>
  )
}
