"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, UserRound, TrendingUp, Clock, Percent, UserPlus, UserCheck, Check, X } from "lucide-react"
import { getUserStats } from "@/lib/actions/user-stats"
import { getContactStatus, sendContactRequest, acceptContactRequest, rejectContactRequest } from "@/lib/actions/contact-requests"
import { toast } from "@/hooks/use-toast"

interface UserPreviewModalProps {
  userId: string | null
  currentUserId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserPreviewModal({ userId, currentUserId, open, onOpenChange }: UserPreviewModalProps) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [contactStatus, setContactStatus] = useState<{ status: string; requestId?: string } | null>(null)
  const [contactLoading, setContactLoading] = useState(false)

  useEffect(() => {
    if (open && userId) {
      setLoading(true)
      setStats(null)
      setContactStatus(null)
      getUserStats(userId).then((result) => {
        if (result.success) setStats(result)
        setLoading(false)
      })
      getContactStatus(userId).then((result) => {
        if (result.success) {
          setContactStatus({ status: result.status || "none", requestId: result.requestId })
        }
      })
    }
  }, [open, userId])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount)

  const isOwnProfile = (currentUserId && userId && currentUserId === userId) || contactStatus?.status === "self"

  const handleAddContact = async () => {
    if (!userId) return
    setContactLoading(true)
    const result = await sendContactRequest(userId)
    if (result.success) {
      setContactStatus({ status: "pending_sent" })
      toast({ title: "Contact request sent!" })
    } else {
      toast({ title: "Error", description: result.error || "Failed to send request", variant: "destructive" })
    }
    setContactLoading(false)
  }

  const handleAccept = async () => {
    if (!contactStatus?.requestId) return
    setContactLoading(true)
    const result = await acceptContactRequest(contactStatus.requestId)
    if (result.success) {
      setContactStatus({ status: "accepted" })
      toast({ title: "Contact accepted!", description: "You are now connected." })
    } else {
      toast({ title: "Error", description: result.error || "Failed to accept", variant: "destructive" })
    }
    setContactLoading(false)
  }

  const handleReject = async () => {
    if (!contactStatus?.requestId) return
    setContactLoading(true)
    const result = await rejectContactRequest(contactStatus.requestId)
    if (result.success) {
      setContactStatus({ status: "rejected" })
      toast({ title: "Contact request declined" })
    } else {
      toast({ title: "Error", description: result.error || "Failed to decline", variant: "destructive" })
    }
    setContactLoading(false)
  }

  const renderContactButton = () => {
    if (isOwnProfile) return null

    if (!contactStatus) {
      return (
        <Button variant="outline" className="w-full text-xs h-8 gap-1.5" disabled>
          <Loader2 className="h-3 w-3 animate-spin" />
        </Button>
      )
    }

    switch (contactStatus.status) {
      case "none":
      case "rejected":
        return (
          <Button variant="default" className="w-full text-xs h-8 gap-1.5" onClick={handleAddContact} disabled={contactLoading}>
            {contactLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
            Add to Contacts
          </Button>
        )
      case "pending_sent":
        return (
          <Button variant="secondary" className="w-full text-xs h-8 gap-1.5" disabled>
            <UserCheck className="h-3 w-3" />
            Request Sent
          </Button>
        )
      case "pending_received":
        return (
          <div className="flex gap-2 w-full mt-2">
            <Button variant="default" className="flex-1 text-xs h-8 gap-1" onClick={handleAccept} disabled={contactLoading}>
              {contactLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Accept
            </Button>
            <Button variant="outline" className="flex-1 text-xs h-8 gap-1" onClick={handleReject} disabled={contactLoading}>
              {contactLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
              Decline
            </Button>
          </div>
        )
      case "accepted":
        return (
          <Button variant="secondary" className="w-full text-xs h-8 gap-1.5" disabled>
            <UserCheck className="h-3 w-3" />
            Connected
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="text-center">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : stats ? (
            <>
              <div className="flex flex-col items-center gap-2 mb-2">
                <Avatar className="h-16 w-16">
                  {stats.profile?.avatarUrl ? (
                    <AvatarImage src={stats.profile.avatarUrl} alt={stats.profile.displayName} />
                  ) : (
                    <AvatarFallback className="bg-blue-100">
                      <UserRound className="h-8 w-8 text-blue-500" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <DialogTitle className="text-lg">{stats.profile?.displayName || "User"}</DialogTitle>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mt-1">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <TrendingUp className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(stats.lending?.amountIssued || 0)}
                  </p>
                  <p className="text-[11px] text-gray-500">Lent</p>
                  <p className="text-[11px] text-gray-400 font-medium">{stats.lending?.loansIssued || 0} loans issued</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <TrendingUp className="h-4 w-4 text-green-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(stats.borrowing?.totalAmountTaken || 0)}
                  </p>
                  <p className="text-[11px] text-gray-500">Borrowed</p>
                  <p className="text-[11px] text-gray-400 font-medium">{stats.borrowing?.loansTakenCount || 0} loans taken</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mt-1">
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <Clock className="h-3.5 w-3.5 text-gray-500 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-gray-900">{stats.borrowing?.avgTenorMonths || 0}m</p>
                  <p className="text-[10px] text-gray-500">Avg Tenor</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <Percent className="h-3.5 w-3.5 text-gray-500 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-gray-900">{stats.borrowing?.repaymentRate || 0}%</p>
                  <p className="text-[10px] text-gray-500">Repayment</p>
                </div>
              </div>

              {renderContactButton()}


            </>
          ) : (
            <p className="text-sm text-gray-500 py-4">Could not load user stats</p>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
