"use client"

import { useState, useEffect } from "react"
import { getNotifications, markAllNotificationsAsRead } from "@/lib/actions/notifications"
import { NotificationItem } from "@/components/notifications/notification-item"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell, CheckCheck } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useNotificationRealtime } from "@/hooks/use-notification-realtime"

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  const fetchNotifications = async (includeRead = true) => {
    setLoading(true)
    try {
      const result = await getNotifications(1, 50, includeRead)
      if (result.error) {
        toast({
          title: "Error",
          description: "Failed to load notifications. Please try again.",
          variant: "destructive",
        })
        setNotifications([])
        setUnreadCount(0)
      } else {
        setNotifications(result.notifications || [])
        setUnreadCount(result.unreadCount || 0)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications(true)
  }, [])

  useNotificationRealtime(() => {
    fetchNotifications(true)
  })

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead()
      if (result.success) {
        toast({
          title: "Success",
          description: "All notifications marked as read.",
        })
        fetchNotifications(true)
      } else {
        toast({
          title: "Error",
          description: "Failed to mark all notifications as read. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Filter notifications by type for activity categories
  const getFilteredNotifications = () => {
    if (activeTab === "all") {
      return notifications
    } else if (activeTab === "unread") {
      return notifications.filter((notification) => !notification.is_read)
    } else if (activeTab === "transactions") {
      return notifications.filter((notification) =>
        ["transaction", "deposit", "withdrawal"].includes(notification.type),
      )
    } else if (activeTab === "account") {
      return notifications.filter((notification) =>
        ["account_created", "security_alert", "virtual_account_created", "virtual_account_funded"].includes(
          notification.type,
        ),
      )
    } else if (activeTab === "connections") {
      return notifications.filter((notification) =>
        ["follow", "connection_request", "connection_accepted"].includes(notification.type),
      )
    } else if (activeTab === "profile") {
      return notifications.filter((notification) =>
        ["profile_updated", "verification_started", "verification_completed"].includes(notification.type),
      )
    } else if (activeTab === "loans") {
      return notifications.filter((notification) =>
        ["loan_request", "loan_approved", "loan_rejected", "loan_search_match", "loan_offer", "loan_offer_accepted", "loan_offer_rejected"].includes(notification.type),
      )
    } else if (activeTab === "messages") {
      return notifications.filter((notification) => notification.type === "message")
    } else {
      return notifications
    }
  }

  const filteredNotifications = getFilteredNotifications()

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          {unreadCount > 0 && (
            <TabsTrigger value="unread" className="relative">
              Unread
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            </TabsTrigger>
          )}
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 border rounded-md">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onUpdate={() => fetchNotifications(true)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                {activeTab === "unread"
                  ? "You have no unread notifications."
                  : activeTab === "all"
                    ? "You don't have any notifications yet."
                    : `You don't have any ${activeTab} notifications yet.`}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
