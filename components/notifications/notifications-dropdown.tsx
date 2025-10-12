"use client"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Bell, Check, Loader2 } from "lucide-react"
import { NotificationItem } from "@/components/notifications/notification-item"
import { getNotifications, markAllNotificationsAsRead } from "@/lib/actions/notifications"
import { NotificationBadge } from "@/components/notifications/notification-badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Notification } from "@/lib/actions/notifications"
import { useToast } from "@/hooks/use-toast"
import { useSupabaseClient } from "@/components/supabase/SupabaseProvider"

interface NotificationsDropdownProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onNotificationRead?: () => void
}

export function NotificationsDropdown({ open, onOpenChange, onNotificationRead }: NotificationsDropdownProps = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false)
  const [isOpen, setIsOpen] = useState(open || false)
  const { toast } = useToast()
  const { supabase, session } = useSupabaseClient()

  // Use controlled or uncontrolled state based on props
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const result = await getNotifications(1, 10)
      if (!result.error) {
        const all = (result.notifications || []) as Notification[]
        const filtered = all.filter((n) => n.type !== "message")
        // Recompute unread for non-message notifications if backend count is aggregate
        const unread = filtered.filter((n) => !n.is_read).length
        setNotifications(filtered)
        setUnreadCount(unread)
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open !== undefined ? open : isOpen) {
      fetchNotifications()
    }
  }, [open, isOpen])

  useEffect(() => {
    if (!supabase || !session?.user?.id) return
    // Subscribe to realtime notifications for this user
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          if (newNotif.type === "message") return // ignore message notifications here
          setNotifications((prev) => [newNotif, ...prev])
          setUnreadCount((prev) => prev + 1)
          new Audio('/notification.mp3').play()
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, session?.user?.id])

  const handleMarkAllAsRead = async () => {
    setMarkingAllAsRead(true)
    try {
      // Don't pass any userId, let the server function handle it
      const result = await markAllNotificationsAsRead()

      if (result.success) {
        toast({
          title: "Success",
          description: "All notifications marked as read",
        })
        fetchNotifications()
      } else {
        toast({
          title: "Error",
          description: "Failed to mark all notifications as read",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      })
    } finally {
      setMarkingAllAsRead(false)
    }
  }

  return (
    <DropdownMenu open={open !== undefined ? open : isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group transition-all">
          <NotificationBadge />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={markingAllAsRead}
            >
              {markingAllAsRead ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="py-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onUpdate={() => {
                    fetchNotifications()
                    onNotificationRead?.()
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Button variant="ghost" className="w-full justify-center" asChild>
            <a href="/notifications">View all notifications</a>
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
