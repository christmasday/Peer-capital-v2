"use client"

import type React from "react"

import { useState } from "react"
import type { Notification } from "@/lib/actions/notifications"
import { markNotificationAsRead, deleteNotification } from "@/lib/actions/notifications"
import { acceptContactRequest, rejectContactRequest } from "@/lib/actions/contact-requests"
import { formatDistanceToNow, format } from "date-fns"
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
  Star,
  Search,
  X,
  UserCheck,
  ChevronDown,
  ExternalLink,
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
  const [expanded, setExpanded] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"pending" | "accepted" | "rejected" | null>(
    notification.type === "connection_request" ? "pending" : null
  )

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
      case "connection_request":
        return <UserPlus className="h-5 w-5 text-blue-500" />
      case "connection_accepted":
        return <UserCheck className="h-5 w-5 text-green-500" />
      case "follow":
        return <UserPlus className="h-5 w-5 text-blue-500" />
      case "message":
        return <MessageCircle className="h-5 w-5 text-purple-500" />
      case "loan_request":
      case "loan_approved":
      case "loan_rejected":
        return <CreditCard className="h-5 w-5 text-green-500" />
      case "loan_offer":
      case "loan_offer_accepted":
      case "loan_offer_rejected":
        return <CreditCard className="h-5 w-5 text-cyan-500" />
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
      case "review":
        return <Star className="h-5 w-5 text-amber-500" />
      case "loan_search_match":
        return <Search className="h-5 w-5 text-cyan-500" />
      case "system":
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  // Update the getActionLink function to handle all activity types
  const getActionLink = () => {
    switch (notification.type) {
      case "connection_request":
        return notification.data?.requesterId
          ? `/profile/${notification.data.requesterId}`
          : "#"
      case "connection_accepted":
        return notification.data?.acceptorId
          ? `/profile/${notification.data.acceptorId}`
          : "#"
      case "follow":
        return notification.data?.senderId || notification.actor_id
          ? `/profile/${notification.data?.senderId || notification.actor_id}`
          : "#"
      case "message":
        return notification.data?.senderId || notification.actor_id
          ? `/profile/${notification.data?.senderId || notification.actor_id}`
          : "/support-inbox"
      case "loan_request":
        // Go to profile page, loan-requests tab, highlight the new request
        return notification.reference_id
          ? `/profile?tab=loan-requests&highlight=${notification.reference_id}`
          : "/profile?tab=loan-requests"
      case "loan_search_match":
        return notification.data?.targetPath || "/home"
      case "loan_offer":
        return notification.reference_id ? `/loan-offers/${notification.reference_id}` : "/loans"
      case "loan_offer_accepted":
      case "loan_offer_rejected":
        return notification.reference_id ? `/loan-offers/${notification.reference_id}` : "/loans"
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
        return "/profile"
      case "verification_started":
        return "/profile"
      case "verification_completed":
        return "/profile"
      case "account_created":
        return "/profile"
      case "security_alert":
        return "/profile/change-password"
      case "review":
        return notification.data?.reviewerId
          ? `/profile/${notification.data.reviewerId}?tab=reviews`
          : "/profile?tab=reviews"
      default:
        return "#"
    }
  }

  // Update the getAvatar function to handle undefined data
  const getAvatar = () => {
    // Check if notification.data exists before trying to access its properties
    const profilePic = notification.data?.senderProfilePicture || notification.data?.requesterProfilePicture
    const profileName = notification.data?.senderName || notification.data?.requesterName
    if (notification.data && (profilePic || profileName)) {
      return (
        <Avatar className="h-9 w-9">
          <AvatarImage src={profilePic || "/placeholder.svg"} alt="Profile" />
          <AvatarFallback>{profileName?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
      )
    }

    // Fallback to type-based icon
    return <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">{getIcon()}</div>
  }

  const formatCurrency = (amount: number | string | undefined | null) => {
    const num = Number(amount)
    if (isNaN(num)) return ""
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(num)
  }

  const getTitle = () => {
    const d = notification.data
    switch (notification.type) {
      case "connection_request":
        return d?.requesterName ? `${d.requesterName} wants to connect` : "Contact Request"
      case "connection_accepted":
        return d?.acceptorName ? `${d.acceptorName} accepted your request` : "Contact Connected"
      case "follow":
        return d?.followerName ? `${d.followerName} started following you` : "New Follower"
      case "message":
        return "New Message"
      case "loan_request":
        return d?.amount ? `Loan request for ${formatCurrency(d.amount)}` : "Loan Request"
      case "loan_approved":
        return d?.amount ? `Loan of ${formatCurrency(d.amount)} approved` : "Loan Approved"
      case "loan_rejected":
        return d?.amount ? `Loan of ${formatCurrency(d.amount)} declined` : "Loan Declined"
      case "transaction":
        return "Transaction"
      case "deposit":
        return d?.amount ? `${formatCurrency(d.amount)} deposited` : "Account Funded"
      case "withdrawal":
        return d?.amount ? `${formatCurrency(d.amount)} withdrawn` : "Withdrawal"
      case "virtual_account_created":
        return "Virtual account created"
      case "virtual_account_funded":
        return d?.amount ? `${formatCurrency(d.amount)} received` : "Virtual Account Funded"
      case "profile_updated":
        return d?.details ? `Profile updated: ${d.details}` : "Profile Updated"
      case "verification_started":
        return "Verification started"
      case "verification_completed":
        return "Verification completed"
      case "account_created":
        return "Account created"
      case "security_alert":
        return "Security alert"
      case "review":
        return d?.rating ? `New ${d.rating}-star review` : "New Review"
      case "loan_search_match":
        return "Lender match found"
      case "loan_offer":
        return d?.amount ? `Loan offer for ${formatCurrency(d.amount)}` : "Loan Offer"
      case "loan_offer_accepted":
        return d?.amount ? `Offer of ${formatCurrency(d.amount)} accepted` : "Offer Accepted"
      case "loan_offer_rejected":
        return d?.amount ? `Offer of ${formatCurrency(d.amount)} declined` : "Offer Declined"
      case "loan_search":
        return "Search Alert"
      case "loan_helper_set":
        return "Lender settings updated"
      case "password_changed":
        return "Password changed"
      case "settings_updated":
        return "Settings updated"
      case "post_created":
        return "New post"
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

        <p className={cn("text-sm text-muted-foreground", !expanded && "line-clamp-2")}>{notification.content}</p>

        {notification.type === "review" && notification.data?.preview && (
          <div className="mt-1 p-2 bg-muted/30 rounded text-sm italic line-clamp-2">"{notification.data.preview}"</div>
        )}

        {notification.type === "connection_request" && notification.data?.requesterId && connectionStatus === "pending" && (
          <div className="flex gap-2 mt-2">
            <Button variant="default" size="sm" onClick={async (e) => {
              e.stopPropagation()
              const requestId = notification.data?.requestId
              if (!requestId) {
                toast({ title: "Error", description: "Could not find contact request", variant: "destructive" })
                return
              }
              setIsLoading(true)
              const result = await acceptContactRequest(requestId)
              if (result.success) {
                setConnectionStatus("accepted")
                toast({ title: "Contact request accepted", description: "You are now connected!" })
                onUpdate()
              } else {
                toast({ title: "Error", description: result.error || "Failed to accept", variant: "destructive" })
              }
              setIsLoading(false)
            }} disabled={isLoading}>
              <UserCheck className="h-4 w-4 mr-1" /> Accept
            </Button>
            <Button variant="outline" size="sm" onClick={async (e) => {
              e.stopPropagation()
              const requestId = notification.data?.requestId
              if (!requestId) return
              setIsLoading(true)
              const result = await rejectContactRequest(requestId)
              if (result.success) {
                setConnectionStatus("rejected")
                toast({ title: "Contact request declined" })
                onUpdate()
              } else {
                toast({ title: "Error", description: result.error || "Failed to decline", variant: "destructive" })
              }
              setIsLoading(false)
            }} disabled={isLoading}>
              <X className="h-4 w-4 mr-1" /> Decline
            </Button>
          </div>
        )}

        {notification.type === "connection_request" && connectionStatus === "accepted" && (
          <div className="flex gap-2 mt-2">
            <Button variant="secondary" size="sm" disabled>
              <UserCheck className="h-4 w-4 mr-1" /> Connected
            </Button>
          </div>
        )}

        {notification.type === "connection_request" && connectionStatus === "rejected" && (
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" disabled>
              <X className="h-4 w-4 mr-1" /> Declined
            </Button>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          {notification.type !== "connection_request" && (
            expanded ? (
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setExpanded(false) }}>
                <ChevronDown className="h-4 w-4 mr-1 rotate-180 transition-transform" /> Collapse
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setExpanded(true) }}>
                <ChevronDown className="h-4 w-4 mr-1 transition-transform" /> View
              </Button>
            )
          )}

          {!notification.is_read && (
            <Button variant="ghost" size="sm" onClick={handleMarkAsRead} disabled={isLoading}>
              <Check className="h-4 w-4 mr-1" /> Mark as read
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isLoading} className="ml-auto">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm overflow-hidden">
            {notification.content && (
              <div>
                <span className="text-xs font-medium text-gray-500">Content</span>
                <p className="text-gray-700 mt-0.5 break-words">{notification.content}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="font-medium text-gray-700">Type: <span className="font-normal text-gray-500">{notification.type}</span></span>
              <span className="font-medium text-gray-700">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                <span className="font-normal text-gray-400 ml-1">
                  ({format(new Date(notification.created_at), "MMM d, yyyy h:mm a")})
                </span>
              </span>
            </div>
            {notification.data && Object.keys(notification.data).length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500">Details</span>
                <div className="mt-0.5 bg-gray-50 rounded p-2 space-y-1 overflow-hidden">
                  {Object.entries(notification.data).map(([key, value]) => {
                    if (["senderProfilePicture", "requesterProfilePicture", "acceptorProfilePicture", "targetPath", "lenderName", "loanRequestId", "lenderImageUrl", "actor_id", "lenderId", "borrowerId", "subscriptionId", "deliveryEntityId", "original_actor_id"].includes(key)) return null
                    const displayValue = typeof value === "object" ? JSON.stringify(value) : String(value ?? "")
                    if (!displayValue || displayValue === "") return null
                    return (
                      <div key={key} className="flex gap-2 text-xs">
                        <span className="font-medium text-gray-600 capitalize min-w-[100px] shrink-0">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                        <span className="text-gray-700 break-words min-w-0">{displayValue}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {getActionLink() !== "#" && (
              <Link href={getActionLink()} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                View details
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Add default export that references the named export
export default NotificationItem
