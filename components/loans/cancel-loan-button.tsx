"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cancelLoanRequest } from "@/lib/actions/loans"

interface CancelLoanButtonProps {
  loanId: string
}

export function CancelLoanButton({ loanId }: CancelLoanButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleCancel = async () => {
    try {
      setIsLoading(true)
      const result = await cancelLoanRequest(loanId)

      if (result.error) {
      }

      setIsOpen(false)
      router.refresh()
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
          Cancel Request
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Loan Request</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this loan request? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
            {isLoading ? "Cancelling..." : "Yes, cancel request"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
