"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { transferFromAccount } from "@/lib/actions/account"
import { ReceiptModal } from "@/components/receipts/receipt-modal"

// Form schema
const formSchema = z.object({
  amount: z
    .number()
    .min(1000, "Minimum withdrawal amount is ₦1,000")
    .max(1000000, "Maximum withdrawal amount is ₦1,000,000"),
  beneficiaryId: z.string().min(1, "Please select a beneficiary"),
  reason: z.string().min(1, "Please enter a reason for this transfer"),
})

type FormValues = z.infer<typeof formSchema>

interface TransferFormProps {
  currentBalance: number
}

export function TransferForm({ currentBalance }: TransferFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [transactionDetails, setTransactionDetails] = useState<{
    id: string
    reference: string
    amount: number
    type: string
    description: string
    status: string
    created_at: string
    newBalance: number
    recipient?: {
      bankName?: string
      accountNumber?: string
      accountName?: string
    }
    fee?: number
  } | null>(null)

  // State for beneficiaries
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(true)
  const [beneficiariesError, setBeneficiariesError] = useState<string | null>(null)

  // Fetch beneficiaries from API
  useEffect(() => {
    async function fetchBeneficiaries() {
      setBeneficiariesLoading(true)
      setBeneficiariesError(null)
      try {
        const res = await fetch("/api/beneficiaries", { credentials: "include" })
        if (!res.ok) throw new Error("Failed to fetch beneficiaries")
        const data = await res.json()
        setBeneficiaries(data.beneficiaries || [])
      } catch (err) {
        setBeneficiariesError("Could not load beneficiaries list")
      } finally {
        setBeneficiariesLoading(false)
      }
    }
    fetchBeneficiaries()
  }, [])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      beneficiaryId: "",
      reason: "",
    },
  })

  // Watch amount for fee calculation
  const amount = form.watch("amount")

  // Calculate transfer fee based on new pricing structure
  const calculateFee = () => {
    if (!amount) return 0
    if (amount <= 5000) return 10
    if (amount <= 50000) return 25
    return 50
  }

  const fee = calculateFee()
  const totalAmount = amount ? amount + fee : 0

  // Find selected beneficiary
  const beneficiaryId = form.watch("beneficiaryId")
  const selectedBeneficiary = beneficiaries.find(b => b.id === beneficiaryId)

  // Handle form submission
  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)
      setError(null)

      // Check if amount is greater than current balance
      if (values.amount > currentBalance) {
        setError("Insufficient balance for this transfer")
        return
      }

      if (!selectedBeneficiary) {
        setError("Please select a beneficiary")
        return
      }

      // Submit transfer request via API route
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
        amount: values.amount,
        bankName: selectedBeneficiary.bank_name,
        accountNumber: selectedBeneficiary.account_number,
        accountName: selectedBeneficiary.account_name,
        recipientCode: selectedBeneficiary.recipient_code,
          reason: values.reason,
        }),
      })
      const result = await res.json()

      if (!res.ok || result.error) {
        setError(result.error || "Transfer failed")
        return
      }

      // Show success message
      setSuccess(true)
      setTransactionDetails({
        id: result.transactionId || "",
        reference: result.reference || "",
        amount: values.amount,
        type: "transfer",
        description: `Transfer to ${selectedBeneficiary.bank_name} - ${selectedBeneficiary.account_number} (${selectedBeneficiary.account_name})`,
        status: "pending",
        created_at: new Date().toISOString(),
        newBalance: result.newBalance || 0,
        recipient: {
          bankName: selectedBeneficiary.bank_name,
          accountNumber: selectedBeneficiary.account_number,
          accountName: selectedBeneficiary.account_name,
        },
        fee: fee,
      })

      // Reset form
      form.reset()
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Transfer Funds</CardTitle>
            <CardDescription>Transfer money from your Peer Capital account</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <div className="space-y-6">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Transfer Successful</AlertTitle>
              <AlertDescription className="text-green-700">
                Your transfer request has been submitted successfully. It will be processed within the hour.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900">Transaction Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Reference:</div>
                <div className="font-medium">{transactionDetails?.reference}</div>

                <div className="text-gray-500">Amount:</div>
                <div className="font-medium">{formatCurrency(transactionDetails?.amount || 0)}</div>

                <div className="text-gray-500">Fee:</div>
                <div className="font-medium">{formatCurrency(transactionDetails?.fee || 0)}</div>

                <div className="text-gray-500">New Balance:</div>
                <div className="font-medium">{formatCurrency(transactionDetails?.newBalance || 0)}</div>
              </div>
            </div>

            {transactionDetails && (
              <div className="flex justify-center">
                <ReceiptModal transaction={transactionDetails} />
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/home")}>
                Back to Home
              </Button>
              <Button onClick={() => router.push("/transactions")}>View Transactions</Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium">Available Balance:</span>
                  <span className="text-blue-800 font-bold">{formatCurrency(currentBalance)}</span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to Transfer</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || undefined)}
                        min={1000}
                        max={currentBalance}
                      />
                    </FormControl>
                    <FormDescription>Minimum: ₦1,000 | Maximum: ₦1,000,000</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beneficiaryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beneficiary</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={beneficiariesLoading || !!beneficiariesError}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={beneficiariesLoading ? "Loading beneficiaries..." : beneficiariesError ? beneficiariesError : "Select a beneficiary"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {beneficiaries.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.bank_name} - {b.account_number} ({b.account_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transfer Reason</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter reason for transfer"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>State the purpose of this transfer.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {amount > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h3 className="font-medium text-gray-900">Transaction Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500">Transfer Amount:</div>
                    <div className="font-medium">{formatCurrency(amount)}</div>

                    <div className="text-gray-500">Processing Fee:</div>
                    <div className="font-medium">{formatCurrency(fee)}</div>

                    <div className="text-gray-500 font-medium">Total Amount:</div>
                    <div className="font-bold">{formatCurrency(totalAmount)}</div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" 
                disabled={
                  isSubmitting ||
                  beneficiariesLoading ||
                  !form.getValues("beneficiaryId")
                }
              >
                {isSubmitting ? "Processing..." : "Transfer Funds"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <p className="text-xs text-gray-500">
          Note: Transfers are processed within 24 hours. A 0.5% processing fee applies to all transfers.
        </p>
      </CardFooter>
    </Card>
  )
}
