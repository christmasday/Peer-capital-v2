"use client"

import { useRef } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

interface TransactionReceiptProps {
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
  onDownload?: () => void
}

export function TransactionReceipt({ transaction, onDownload }: TransactionReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a")
    } catch (error) {
      return dateString
    }
  }

  // Generate PDF from the receipt
  const generatePDF = async () => {
    try {
      // Dynamically import html2canvas and jsPDF to reduce bundle size
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")

      if (!receiptRef.current) return

      toast({
        title: "Generating receipt...",
        description: "Please wait while we generate your receipt.",
      })

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`PeerCapital_Receipt_${transaction.reference}.pdf`)

      toast({
        title: "Receipt downloaded",
        description: "Your receipt has been downloaded successfully.",
      })

      if (onDownload) {
        onDownload()
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error generating receipt",
        description: "There was an error generating your receipt. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col items-center">
      <Card className="w-full max-w-[800px] p-8 bg-white" ref={receiptRef}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="relative h-12 w-12">
              <Image src="/peer-capital-logo-new.png" alt="Peer Capital" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Peer Capital</h1>
              <p className="text-sm text-gray-500">Transaction Receipt</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Receipt No:</p>
            <p className="font-medium">{transaction.reference}</p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Transaction Details */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Transaction Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Transaction Type</p>
              <p className="font-medium capitalize">{transaction.type.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium">{formatDate(transaction.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">{formatCurrency(transaction.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium capitalize">{transaction.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Reference</p>
              <p className="font-medium">{transaction.reference}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="font-medium">{transaction.id}</p>
            </div>
          </div>
        </div>

        {/* Recipient Details (for withdrawals) */}
        {transaction.type === "withdrawal" && transaction.recipient && (
          <>
            <Separator className="my-4" />
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Recipient Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Bank Name</p>
                  <p className="font-medium">{transaction.recipient.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="font-medium">{transaction.recipient.accountNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Name</p>
                  <p className="font-medium">{transaction.recipient.accountName}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Payment Summary */}
        <Separator className="my-4" />
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="text-gray-500">Transaction Amount</p>
              <p className="font-medium">{formatCurrency(transaction.amount)}</p>
            </div>
            {transaction.fee !== undefined && (
              <div className="flex justify-between">
                <p className="text-gray-500">Processing Fee</p>
                <p className="font-medium">{formatCurrency(transaction.fee)}</p>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <p>Total</p>
              <p>
                {formatCurrency(
                  transaction.fee !== undefined ? transaction.amount + transaction.fee : transaction.amount,
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Separator className="my-4" />
        <div className="text-center text-sm text-gray-500 mt-6">
          <p>Thank you for using Peer Capital</p>
          <p>For any inquiries, please contact support@peercapital.com</p>
          <p>© {new Date().getFullYear()} Peer Capital. All rights reserved.</p>
        </div>
      </Card>

      <Button onClick={generatePDF} className="mt-6 gap-2">
        <Download className="h-4 w-4" />
        Download Receipt
      </Button>
    </div>
  )
}
