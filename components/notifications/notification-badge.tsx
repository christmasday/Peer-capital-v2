"use client"

import { useEffect, useState, useCallback } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getUnreadNotificationsCount } from "@/lib/actions/notifications"
import { useNotificationRealtime } from "@/hooks/use-notification-realtime"

interface NotificationBadgeProps {
  className?: string
  onCountChange?: (count: number) => void
}

export function NotificationBadge({ className, onCountChange }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getUnreadNotificationsCount()

      if (result.success && result.count !== undefined) {
        setUnreadCount(result.count)
        onCountChange?.(result.count)
      } else if (result.error) {
        console.error("Failed to fetch unread notification count:", result.error)
        setError(result.error)
      }
    } catch (err) {
      console.error("Failed to fetch unread notification count:", err)
      setError("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }, [onCountChange])

  const { isRealtimeConnected } = useNotificationRealtime(() => {
    void fetchUnreadCount()
  })

  useEffect(() => {
    void fetchUnreadCount()
  }, [fetchUnreadCount])

  useEffect(() => {
    if (isRealtimeConnected) return

    const intervalId = setInterval(() => {
      void fetchUnreadCount()
    }, 300000)

    return () => clearInterval(intervalId)
  }, [isRealtimeConnected, fetchUnreadCount])

  return (
    <div className={`relative group ${className || ""}`}>
      <Bell className="h-5 w-5 text-gray-600 transition-all duration-300 group-hover:text-yellow-500 group-hover:drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]" />
      {!loading && !error && unreadCount > 0 && (
        <Badge
          className="absolute -top-2.5 -right-2.5 h-4.5 min-w-[18px] flex items-center justify-center p-0 bg-red-500 text-white text-[10px] font-bold leading-none"
          variant="destructive"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
      {!loading && !error && unreadCount > 0 && (
        <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-ping opacity-75" />
      )}
    </div>
  )
}
