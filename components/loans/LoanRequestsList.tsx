"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CancelLoanButton } from "@/components/loans/cancel-loan-button"
import { UserRound } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ApproveLoanModal } from "@/components/loans/ApproveLoanModal"
import { RejectLoanModal } from "@/components/loans/RejectLoanModal"
import { useState, useEffect } from "react"
import { getAllLoanRequests, rejectLoanRequest } from "@/lib/actions/loans"

interface LoanRequestsListProps {
  loanRequests: any[]
  currentUserId?: string
  showAdminActions?: boolean
  highlight?: string
}

export function LoanRequestsList({ loanRequests: initialLoanRequests, currentUserId, showAdminActions = false, highlight }: LoanRequestsListProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [loanRequests, setLoanRequests] = useState(initialLoanRequests)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null)

  // Scroll to and highlight the card if highlight is set
  useEffect(() => {
    if (highlight) {
      const el = document.getElementById(`loan-request-${highlight}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.classList.add("ring-2", "ring-blue-500", "ring-offset-2")
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-blue-500", "ring-offset-2")
        }, 3000)
      }
    }
  }, [highlight])

  const fetchLoanRequests = async () => {
    const res = await getAllLoanRequests()
    setLoanRequests(res.loanRequests || [])
  }

  useEffect(() => {
    setLoanRequests(initialLoanRequests)
  }, [initialLoanRequests])

  const handleApprove = (loanId: string) => {
    const req = loanRequests.find(r => r.id === loanId)
    setSelectedRequest(req)
    setModalOpen(true)
  }
  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedRequest(null)
  }
  const handleSuccess = async () => {
    setModalOpen(false)
    setSelectedRequest(null)
    await fetchLoanRequests()
  }
  const openRejectModal = (loanId: string) => {
    setRejectingRequestId(loanId)
    setRejectModalOpen(true)
  }
  const closeRejectModal = () => {
    setRejectModalOpen(false)
    setRejectingRequestId(null)
    setRejectError(null)
  }
  const confirmReject = async () => {
    if (!rejectingRequestId) return
    setRejectingId(rejectingRequestId)
    setRejectError(null)
    try {
      const result = await rejectLoanRequest({ loanRequestId: rejectingRequestId, approverId: currentUserId || '' })
      if (!result.success) {
        setRejectError(result.error || "Failed to reject loan request")
      } else {
        await fetchLoanRequests()
        closeRejectModal()
      }
    } catch (e: any) {
      setRejectError(e.message || "Failed to reject loan request")
    } finally {
      setRejectingId(null)
    }
  }
  if (!loanRequests || loanRequests.length === 0) {
    return (
      <Card className="shadow-sm mb-4">
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 mb-2">No loan requests found</p>
          <p className="text-sm text-gray-400">Loan requests from all users will appear here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {loanRequests.map((req) => (
        <Card key={req.id} id={`loan-request-${req.id}`} className={"shadow-sm " + (highlight === req.id ? "ring-2 ring-blue-500 ring-offset-2 animate-pulse" : "") }>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Avatar className="h-10 w-10">
              {req.borrower?.profile_picture_url ? (
                <AvatarImage src={req.borrower.profile_picture_url} alt={`${req.borrower.first_name || ""} ${req.borrower.last_name || ""}`} />
              ) : (
                <AvatarFallback className="bg-blue-100">
                  <UserRound className="h-5 w-5 text-blue-500" />
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="font-semibold text-gray-900">{`${req.borrower?.first_name || ""} ${req.borrower?.last_name || ""}`.trim() || "User"}</div>
              <div className="text-xs text-gray-500">Requested on {new Date(req.created_at).toLocaleDateString()}</div>
            </div>
            <div className="ml-auto text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-2">
              <div>
                <div className="text-lg font-bold text-blue-700">₦{req.amount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Duration: {req.duration_months} months</div>
                <div className="text-xs text-gray-500">Interest: {req.interest_rate}%</div>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-700">Purpose: {req.purpose}</div>
              </div>
              {showAdminActions && req.status === "pending" ? (
                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(req.id)}>
                    Approve
                  </Button>
                  <Button variant="destructive" onClick={() => openRejectModal(req.id)} disabled={rejectingId === req.id}>
                    Reject
                  </Button>
                </div>
              ) : currentUserId === req.user_id && req.status === "pending" ? (
                <div className="mt-2 md:mt-0">
                  <CancelLoanButton loanId={req.id} />
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
      <ApproveLoanModal
        open={modalOpen}
        onClose={handleModalClose}
        loanRequest={selectedRequest}
        onSuccess={handleSuccess}
      />
      <RejectLoanModal
        open={rejectModalOpen}
        onClose={closeRejectModal}
        onConfirm={confirmReject}
        loading={!!rejectingId}
        error={rejectError}
      />
    </div>
  )
} 