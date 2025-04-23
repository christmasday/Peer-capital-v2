"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { TransactionReceipt } from "@/components/receipts/transaction-receipt"

interface ReceiptModalProps {
  transaction: {
    id: string
    reference: string
    amount: number
    type: string
    description: string
    status: string
    created_at: string
    recipient?: {
      bankName?: string
      accountNumber?: string
      accountName?: string
    }
    fee?: number
  }
  trigger?: React.ReactNode
}

export function ReceiptModal({ transaction, trigger }: ReceiptModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            View Receipt
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Receipt</DialogTitle>
          <DialogDescription>View and download your transaction receipt</DialogDescription>
        </DialogHeader>
        <TransactionReceipt transaction={transaction} onDownload={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
