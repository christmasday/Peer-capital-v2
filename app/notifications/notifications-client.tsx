"use client"

import { useState } from "react"
import { type Notification, markAllNotificationsAsRead } from "@/lib/actions/notifications"
import { NotificationItem } from "@/components/notifications/notification-item"
import { Button } from "@/components/ui/button"
import { Check, Bell, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"

interface NotificationsClientProps {
  initialNotifications: Notification[]
  initialUnreadCount: number
  error?: string
}

export function NotificationsClient({ initialNotifications, initialUnreadCount, error }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false)
  const { toast } = useToast()

  const handleUpdate = () => {
    // This is a placeholder for refreshing notifications
    // In a real app, you would fetch the latest notifications here
    const updatedNotifications = [...notifications]
    setNotifications(updatedNotifications)

    // Update unread count
    const newUnreadCount = updatedNotifications.filter((n) => !n.is_read).length
    setUnreadCount(newUnreadCount)
  }

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return

    setIsMarkingAllAsRead(true)
    try {
      const result = await markAllNotificationsAsRead()

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      // Update local state
      const updatedNotifications = notifications.map((n) => ({ ...n, is_read: true }))
      setNotifications(updatedNotifications)
      setUnreadCount(0)

      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      })
    } finally {
      setIsMarkingAllAsRead(false)
    }
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">All Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount} unread</span>
          )}
        </div>

        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} disabled={isMarkingAllAsRead} size="sm">
            {isMarkingAllAsRead ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        {notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onUpdate={handleUpdate} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-1">No notifications</h3>
            <p className="text-muted-foreground">You don't have any notifications yet.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
