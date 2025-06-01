"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface RejectLoanModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  error?: string | null
}

export function RejectLoanModal({ open, onClose, onConfirm, loading, error }: RejectLoanModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Loan Request</DialogTitle>
        </DialogHeader>
        <div className="mb-4 text-gray-700">
          Are you sure you want to reject this loan request? This action cannot be undone.
        </div>
        {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Rejecting..." : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 