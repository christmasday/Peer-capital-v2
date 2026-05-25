"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

export function LoanOfferResponseButtons({
  loanRequestId,
  disabled,
}: {
  loanRequestId: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [loadingDecision, setLoadingDecision] = useState<"accept" | "reject" | null>(null)

  const handleDecision = async (decision: "accept" | "reject") => {
    setLoadingDecision(decision)
    try {
      const response = await fetch(`/api/loan-offers/${loanRequestId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update offer")
      }

      toast({
        title: decision === "accept" ? "Offer accepted" : "Offer rejected",
        description: decision === "accept"
          ? "The lender has been notified and the offer status has been updated."
          : "The lender has been notified that the offer was rejected.",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setLoadingDecision(null)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        onClick={() => handleDecision("accept")}
        disabled={disabled || loadingDecision !== null}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        {loadingDecision === "accept" ? "Accepting..." : "Accept offer"}
      </Button>
      <Button
        variant="outline"
        onClick={() => handleDecision("reject")}
        disabled={disabled || loadingDecision !== null}
      >
        {loadingDecision === "reject" ? "Rejecting..." : "Reject offer"}
      </Button>
    </div>
  )
}
