"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import {
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  User,
  CreditCard,
  FileText,
  Building,
  BanknoteIcon as Bank,
} from "lucide-react"
import Link from "next/link"

export interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  status?: string
  amount?: number
  icon?: string
  reference?: string
  accountNumber?: string
  bankName?: string
  accountName?: string
  userId?: string
  userName?: string
}

interface ActivityDetailModalProps {
  activity: ActivityItem | null
  isOpen: boolean
  onClose: () => void
}

export function ActivityDetailModal({ activity, isOpen, onClose }: ActivityDetailModalProps) {
  const [copied, setCopied] = useState<string | null>(null)

  if (!activity) return null

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatAmount = (amount?: number) => {
    if (amount === undefined) return null

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(Math.abs(amount))
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPpp") // e.g., "Apr 29, 2023, 3:45 PM"
    } catch (error) {
      return dateString
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null

    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
            Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-700">
            Processing
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {activity.type === "deposit" || activity.icon === "deposit" ? (
              <ArrowDownLeft className="h-5 w-5 text-green-500" />
            ) : activity.type === "withdrawal" || activity.icon === "withdrawal" ? (
              <ArrowUpRight className="h-5 w-5 text-orange-500" />
            ) : activity.type === "virtual_account_created" || activity.icon === "virtual_account_created" ? (
              <Bank className="h-5 w-5 text-emerald-600" />
            ) : activity.type === "message" || activity.icon === "message" ? (
              <MessageCircle className="h-5 w-5 text-purple-500" />
            ) : activity.type === "connection" || activity.icon === "connection" ? (
              <User className="h-5 w-5 text-blue-500" />
            ) : activity.type === "verification" || activity.icon === "verification" ? (
              <FileText className="h-5 w-5 text-yellow-500" />
            ) : (
              <CreditCard className="h-5 w-5 text-blue-600" />
            )}
            {activity.title}
          </DialogTitle>
          <DialogDescription>{activity.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date and Status */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              <span>{formatDate(activity.timestamp)}</span>
            </div>
            {getStatusBadge(activity.status)}
          </div>

          {/* Amount (for transactions) */}
          {activity.amount !== undefined && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Amount</div>
              <div className={`text-2xl font-bold ${activity.amount > 0 ? "text-green-600" : "text-orange-600"}`}>
                {activity.amount > 0 ? "+" : "-"} {formatAmount(activity.amount)}
              </div>
            </div>
          )}

          {/* Reference (for transactions) */}
          {activity.reference && (
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Reference</div>
                <div className="font-medium">{activity.reference}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(activity.reference!, "reference")}
                className="h-8 px-2"
              >
                {copied === "reference" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {/* Account Details (for virtual account) */}
          {activity.accountNumber && activity.bankName && (
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Account Number</div>
                  <div className="font-medium">{activity.accountNumber}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(activity.accountNumber!, "accountNumber")}
                  className="h-8 px-2"
                >
                  {copied === "accountNumber" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Bank Name</div>
                  <div className="font-medium">{activity.bankName}</div>
                </div>
              </div>

              {activity.accountName && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Account Name</div>
                    <div className="font-medium">{activity.accountName}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Details (for connections and messages) */}
          {activity.userId && activity.userName && (
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">User</div>
                <div className="font-medium">{activity.userName}</div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/profile/${activity.userId}`}>
                  <User className="h-4 w-4 mr-1" /> View Profile
                </Link>
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            {activity.type === "transaction" || activity.type === "deposit" || activity.type === "withdrawal" ? (
              <Button asChild>
                <Link href={activity.reference ? `/transactions/receipt/${activity.reference}` : "/transactions"}>
                  <ExternalLink className="h-4 w-4 mr-1" /> View Receipt
                </Link>
              </Button>
            ) : activity.type === "virtual_account_created" || activity.type === "virtual_account_funded" ? (
              <Button asChild>
                <Link href="/profile/virtual-account">
                  <Building className="h-4 w-4 mr-1" /> Manage Account
                </Link>
              </Button>
            ) : activity.type === "message" ? (
              <Button asChild>
                <Link href={activity.userId ? `/profile/${activity.userId}` : "/support-inbox"}>
                  <MessageCircle className="h-4 w-4 mr-1" /> View Message
                </Link>
              </Button>
            ) : null}

            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
