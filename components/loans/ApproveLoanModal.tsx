"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { approveLoanRequest } from "@/lib/actions/loans"

interface ApproveLoanModalProps {
  open: boolean
  onClose: () => void
  loanRequest: any
  onSuccess: () => void
}

export function ApproveLoanModal({ open, onClose, loanRequest, onSuccess }: ApproveLoanModalProps) {
  if (!loanRequest) return null;

  const [agree, setAgree] = useState(false)
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Dummy fee calculation (replace with real logic)
  const fee = Math.ceil(loanRequest.amount * 0.01)
  const total = loanRequest.amount + fee

  const handleTransfer = async () => {
    setLoading(true)
    setError("")
    try {
      const result = await approveLoanRequest({
        loanRequestId: loanRequest.id,
        pin,
        approverId: loanRequest.helper_id,
      })
      if (!result.success) {
        setError(result.error || "Failed to transfer")
        setLoading(false)
        return
      }
      setSuccess(true)
      setLoading(false)
      onSuccess()
    } catch (e: any) {
      setError(e.message || "Failed to transfer")
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Loan Request</DialogTitle>
        </DialogHeader>
        {success ? (
          <div className="text-center py-8">
            <div className="text-green-600 text-2xl font-bold mb-2">Success!</div>
            <div className="text-gray-700 mb-4">The loan has been transferred to the requester.</div>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="font-semibold mb-1">Transaction Details</div>
              <div className="text-sm text-gray-700">Amount: <span className="font-bold">₦{loanRequest.amount.toLocaleString()}</span></div>
              <div className="text-sm text-gray-700">Transfer Fee: <span className="font-bold">₦{fee.toLocaleString()}</span></div>
              <div className="text-sm text-gray-700">Total: <span className="font-bold">₦{total.toLocaleString()}</span></div>
              <div className="text-sm text-gray-700 mt-2">Recipient: <span className="font-bold">{loanRequest.loan_helpers?.name || "Unknown"}</span></div>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded border">
              <div className="font-semibold mb-1">Peer Capital Terms of Use</div>
              <div className="text-xs text-gray-600 mb-2 max-h-24 overflow-y-auto">
                {/* TODO: Replace with real ToS text */}
                By approving this loan, you agree to Peer Capital's terms and conditions. The transfer is final and non-reversible. Please ensure you trust the recipient and have reviewed all details.
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="agree" checked={agree} onCheckedChange={v => setAgree(!!v)} />
                <label htmlFor="agree" className="text-xs">I agree to Peer Capital's terms and conditions</label>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1">Transaction Pin</label>
              <Input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                maxLength={6}
                placeholder="Enter your 6-digit pin"
                disabled={loading}
              />
            </div>
            {error && <div className="text-red-600 text-xs mb-2">{error}</div>}
            <DialogFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleTransfer}
                disabled={!agree || !pin || loading}
              >
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Transfer"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
} 