"use client"

import type React from "react"

import { useState } from "react"
import type { Notification } from "@/lib/actions/notifications"
import { markNotificationAsRead, deleteNotification } from "@/lib/actions/notifications"
import { formatDistanceToNow } from "date-fns"
import {
  Bell,
  UserPlus,
  CreditCard,
  Check,
  Trash2,
  MessageCircle,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Briefcase,
  BanknoteIcon as Bank,
  CheckCircle2,
  Shield,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface NotificationItemProps {
  notification: Notification
  onUpdate: () => void
}

export function NotificationItem({ notification, onUpdate }: NotificationItemProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    // Stop propagation to prevent the parent div's onClick from firing
    e.stopPropagation()

    if (notification.is_read || isLoading) return

    setIsLoading(true)
    try {
      const result = await markNotificationAsRead(notification.id)
      if (result.success) {
        onUpdate()
      } else {
        console.error("Failed to mark notification as read:", result.error)
        // Don't show error toast for "not found" errors - just refresh the list
        if (result.error?.message?.includes("not found")) {
          onUpdate() // Refresh the list to remove the non-existent notification
        } else {
          setIsError(true)
          toast({
            title: "Error",
            description: "Failed to mark notification as read. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      setIsError(true)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    // Stop propagation to prevent the parent div's onClick from firing
    e.stopPropagation()

    if (isLoading) return

    setIsLoading(true)
    try {
      const result = await deleteNotification(notification.id)
      if (result.success) {
        onUpdate()
      } else {
        console.error("Failed to delete notification:", result.error)
        // Don't show error toast for "not found" errors - just refresh the list
        if (result.error?.message?.includes("not found")) {
          onUpdate() // Refresh the list to remove the non-existent notification
        } else {
          setIsError(true)
          toast({
            title: "Error",
            description: "Failed to delete notification. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      setIsError(true)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get notification icon based on type
  const getIcon = () => {
    switch (notification.type) {
      case "follow":
        return <UserPlus className="h-5 w-5 text-blue-500" />
      case "message":
        return <MessageCircle className="h-5 w-5 text-purple-500" />
      case "loan_request":
      case "loan_approved":
      case "loan_rejected":
        return <CreditCard className="h-5 w-5 text-green-500" />
      case "transaction":
        return <CreditCard className="h-5 w-5 text-purple-500" />
      case "deposit":
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />
      case "withdrawal":
        return <ArrowUpRight className="h-5 w-5 text-orange-500" />
      case "virtual_account_created":
        return <Bank className="h-5 w-5 text-emerald-600" />
      case "virtual_account_funded":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "profile_updated":
        return <Briefcase className="h-5 w-5 text-indigo-500" />
      case "verification_started":
      case "verification_completed":
        return <FileText className="h-5 w-5 text-yellow-500" />
      case "account_created":
        return <User className="h-5 w-5 text-blue-600" />
      case "security_alert":
        return <Shield className="h-5 w-5 text-red-500" />
      case "system":
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  // Update the getActionLink function to handle all activity types
  const getActionLink = () => {
    switch (notification.type) {
      case "follow":
        return notification.data?.senderId || notification.actor_id
          ? `/profile/${notification.data?.senderId || notification.actor_id}`
          : "#"
      case "message":
        return notification.data?.senderId || notification.actor_id
          ? `/messages/${notification.data?.senderId || notification.actor_id}`
          : "/messages"
      case "loan_request":
      case "loan_approved":
      case "loan_rejected":
        return notification.reference_id ? `/loans/${notification.reference_id}` : "/loans"
      case "transaction":
      case "deposit":
      case "withdrawal":
        return notification.reference_id ? `/transactions/receipt/${notification.reference_id}` : "/transactions"
      case "virtual_account_created":
      case "virtual_account_funded":
        return "/profile/virtual-account"
      case "profile_updated":
        return "/profile/edit"
      case "verification_started":
      case "verification_completed":
        return "/profile/edit"
      case "account_created":
        return "/profile"
      case "security_alert":
        return "/profile/change-password"
      default:
        return "#"
    }
  }

  // Update the getAvatar function to handle undefined data
  const getAvatar = () => {
    // Check if notification.data exists before trying to access its properties
    if (notification.data && (notification.data.senderProfilePicture || notification.data.senderName)) {
      return (
        <Avatar className="h-9 w-9">
          <AvatarImage src={notification.data.senderProfilePicture || "/placeholder.svg"} alt="Profile" />
          <AvatarFallback>{notification.data.senderName?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
      )
    }

    // Fallback to type-based icon
    return <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">{getIcon()}</div>
  }

  // Get title based on notification type
  const getTitle = () => {
    switch (notification.type) {
      case "follow":
        return "New Follower"
      case "message":
        return "New Message"
      case "loan_request":
        return "Loan Request"
      case "loan_approved":
        return "Loan Approved"
      case "loan_rejected":
        return "Loan Rejected"
      case "transaction":
        return "Transaction"
      case "deposit":
        return "Account Funded"
      case "withdrawal":
        return "Withdrawal"
      case "virtual_account_created":
        return "Virtual Account Created"
      case "virtual_account_funded":
        return "Virtual Account Funded"
      case "profile_updated":
        return "Profile Updated"
      case "verification_started":
        return "Verification Started"
      case "verification_completed":
        return "Verification Completed"
      case "account_created":
        return "Account Created"
      case "security_alert":
        return "Security Alert"
      case "system":
        return "System Notification"
      default:
        return "Notification"
    }
  }

  // If there's an error with this notification, don't render it
  if (isError) {
    return null
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-muted/50 rounded-md transition-colors",
        !notification.is_read && "bg-blue-50 dark:bg-blue-950/20",
      )}
    >
      {getAvatar()}

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-sm">{getTitle()}</h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{notification.content}</p>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={getActionLink()}>View</Link>
          </Button>

          {!notification.is_read && (
            <Button variant="ghost" size="sm" onClick={handleMarkAsRead} disabled={isLoading}>
              <Check className="h-4 w-4 mr-1" /> Mark as read
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isLoading} className="ml-auto">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
