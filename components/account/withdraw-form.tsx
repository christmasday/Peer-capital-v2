"use client"

import { useState } from "react"
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
import { withdrawFromAccount } from "@/lib/actions/account"
import { ReceiptModal } from "@/components/receipts/receipt-modal"

// Nigerian banks for the dropdown
const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank", code: "023" },
  { name: "Diamond Bank", code: "063" },
  { name: "Ecobank", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank", code: "011" },
  { name: "First City Monument Bank", code: "214" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Polaris Bank", code: "076" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Union Bank", code: "032" },
  { name: "United Bank for Africa", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
]

// Form schema
const formSchema = z.object({
  amount: z
    .number()
    .min(1000, "Minimum withdrawal amount is ₦1,000")
    .max(1000000, "Maximum withdrawal amount is ₦1,000,000"),
  bankName: z.string().min(1, "Please select a bank"),
  accountNumber: z
    .string()
    .min(10, "Account number must be 10 digits")
    .max(10, "Account number must be 10 digits")
    .regex(/^\d+$/, "Account number must contain only digits"),
  accountName: z.string().min(3, "Please enter the account name"),
})

type FormValues = z.infer<typeof formSchema>

interface WithdrawFormProps {
  currentBalance: number
}

export function WithdrawForm({ currentBalance }: WithdrawFormProps) {
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
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
  })

  // Watch amount for fee calculation
  const amount = form.watch("amount")

  // Calculate withdrawal fee (0.5% with a minimum of ₦100)
  const calculateFee = () => {
    if (!amount) return 0
    const fee = Math.max(amount * 0.005, 100)
    return Math.min(fee, 1000) // Cap fee at ₦1,000
  }

  const fee = calculateFee()
  const totalAmount = amount ? amount + fee : 0

  // Handle form submission
  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)
      setError(null)

      // Check if amount is greater than current balance
      if (values.amount > currentBalance) {
        setError("Insufficient balance for this withdrawal")
        return
      }

      // Submit withdrawal request
      const result = await withdrawFromAccount({
        amount: values.amount,
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        accountName: values.accountName,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      // Show success message
      setSuccess(true)
      setTransactionDetails({
        id: result.transactionId || "",
        reference: result.reference || "",
        amount: values.amount,
        type: "withdrawal",
        description: `Withdrawal to ${values.bankName} - ${values.accountNumber} (${values.accountName})`,
        status: "pending",
        created_at: new Date().toISOString(),
        newBalance: result.newBalance || 0,
        recipient: {
          bankName: values.bankName,
          accountNumber: values.accountNumber,
          accountName: values.accountName,
        },
        fee: fee,
      })

      // Reset form
      form.reset()
    } catch (err) {
      console.error("Error submitting withdrawal:", err)
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
            <CardTitle>Withdraw Funds</CardTitle>
            <CardDescription>Withdraw money from your Peer Capital account</CardDescription>
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
              <AlertTitle className="text-green-800">Withdrawal Successful</AlertTitle>
              <AlertDescription className="text-green-700">
                Your withdrawal request has been submitted successfully. It will be processed within 24 hours.
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
                    <FormLabel>Amount to Withdraw</FormLabel>
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
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your bank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NIGERIAN_BANKS.map((bank) => (
                          <SelectItem key={bank.code} value={bank.name}>
                            {bank.name}
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
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter 10-digit account number" {...field} maxLength={10} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter account name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {amount > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h3 className="font-medium text-gray-900">Transaction Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500">Withdrawal Amount:</div>
                    <div className="font-medium">{formatCurrency(amount)}</div>

                    <div className="text-gray-500">Processing Fee (0.5%):</div>
                    <div className="font-medium">{formatCurrency(fee)}</div>

                    <div className="text-gray-500 font-medium">Total Amount:</div>
                    <div className="font-bold">{formatCurrency(totalAmount)}</div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Withdraw Funds"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <p className="text-xs text-gray-500">
          Note: Withdrawals are processed within 24 hours. A 0.5% processing fee applies to all withdrawals.
        </p>
      </CardFooter>
    </Card>
  )
}
