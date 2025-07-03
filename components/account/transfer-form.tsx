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
  amount: z.number().min(1000, "Minimum transfer amount is ₦1,000").max(1000000, "Maximum transfer amount is ₦1,000,000"),
  reason: z.string().min(1, "Please enter a reason for this transfer"),
  mode: z.enum(["beneficiary", "manual"]),
  beneficiaryId: z.string().optional(),
  accountNumber: z.string().optional(),
  bankCode: z.string().optional(),
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
  const [transactionDetails, setTransactionDetails] = useState<any>(null)

  // Beneficiaries
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(true)
  const [beneficiariesError, setBeneficiariesError] = useState<string | null>(null)

  // Banks
  const [banks, setBanks] = useState<any[]>([])
  const [banksLoading, setBanksLoading] = useState(false)
  const [banksError, setBanksError] = useState<string | null>(null)

  // Account validation
  const [accountName, setAccountName] = useState<string>("")
  const [accountValidationLoading, setAccountValidationLoading] = useState(false)
  const [accountValidationError, setAccountValidationError] = useState<string | null>(null)

  // NIP Charges
  const [nipCharge, setNipCharge] = useState<number | null>(null)
  const [nipChargeLoading, setNipChargeLoading] = useState(false)
  const [nipChargeError, setNipChargeError] = useState<string | null>(null)

  // Wallet info state
  const [walletInfo, setWalletInfo] = useState<{ walletNumber: string, availableBalance: string } | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)

  // Fetch beneficiaries
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

  // Fetch banks
  const fetchBanks = async () => {
    setBanksLoading(true)
    setBanksError(null)
    try {
      const res = await fetch("/api/alat/debit/get-banks", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch banks")
      const data = await res.json()
      // Map the API response to the expected format (include logo)
      const banksList = (data.result || []).map((b: any) => ({ name: b.bankName, code: b.bankCode, logo: b.bankLogo }))
      setBanks(banksList)
    } catch (err) {
      setBanksError("Could not load banks list")
    } finally {
      setBanksLoading(false)
    }
  }

  // Fetch banks on mount
  useEffect(() => {
    fetchBanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      reason: "",
      mode: "beneficiary",
      beneficiaryId: "",
      accountNumber: "",
      bankCode: "",
    },
  })

  const mode = form.watch("mode")
  const amount = form.watch("amount")
  const accountNumber = form.watch("accountNumber")
  const bankCode = form.watch("bankCode")

  // Validate account when account number and bank are set
  useEffect(() => {
    if (mode === "manual" && accountNumber && bankCode && accountNumber.length >= 10) {
      setAccountValidationLoading(true)
      setAccountValidationError(null)
      setAccountName("")
      fetch(`/api/alat/debit/destination-account-enquiry?accountNumber=${accountNumber}&bankCode=${bankCode}`, { credentials: "include" })
        .then(async (res) => {
          const data = await res.json()
          if (res.ok && data.accountName) {
            setAccountName(data.accountName)
          } else {
            setAccountValidationError(data.message || data.error || "Account validation failed")
          }
        })
        .catch(() => setAccountValidationError("Account validation failed"))
        .finally(() => setAccountValidationLoading(false))
    }
  }, [mode, accountNumber, bankCode])

  // Fetch NIP charge when amount is set
  useEffect(() => {
    if (amount && amount > 0) {
      setNipChargeLoading(true)
      setNipChargeError(null)
      fetch(`/api/alat/debit/get-nip-charges?amount=${amount}`, { credentials: "include" })
        .then(async (res) => {
          const data = await res.json()
          if (res.ok && data.charge) {
            setNipCharge(data.charge)
          } else {
            setNipChargeError(data.message || data.error || "Failed to get NIP charge")
          }
        })
        .catch(() => setNipChargeError("Failed to get NIP charge"))
        .finally(() => setNipChargeLoading(false))
    }
  }, [amount])

  // Fetch wallet info on mount
  useEffect(() => {
    async function fetchWallet() {
      setWalletLoading(true)
      setWalletError(null)
      try {
        // Get account number from localStorage or props (if available)
        let accountNumber = null
        try {
          const userProfile = JSON.parse(localStorage.getItem("userProfile") || "null")
          accountNumber = userProfile?.profile?.account_number
        } catch {}
        if (!accountNumber) return setWalletError("No account number found")
        const res = await fetch(`/api/alat/wallet/get-wallet-balance?accountNumber=${accountNumber}`, { credentials: "include" })
        const data = await res.json()
        if (data.result && data.result.walletNumber && data.result.availableBalance) {
          setWalletInfo({
            walletNumber: data.result.walletNumber,
            availableBalance: data.result.availableBalance,
          })
        } else {
          setWalletError("Could not fetch wallet info")
        }
      } catch (err) {
        setWalletError("Could not fetch wallet info")
      } finally {
        setWalletLoading(false)
      }
    }
    fetchWallet()
  }, [])

  // Handle form submission
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    setTransactionDetails(null)
    try {
      if (values.amount > currentBalance) {
        setError("Insufficient balance for this transfer")
        setIsSubmitting(false)
        return
      }
      let payload: any = {
        amount: values.amount,
        reason: values.reason,
      }
      if (values.mode === "beneficiary") {
        const beneficiary = beneficiaries.find(b => b.id === values.beneficiaryId)
        if (!beneficiary) {
          setError("Please select a beneficiary")
          setIsSubmitting(false)
          return
        }
        payload.accountNumber = beneficiary.account_number
        payload.bankCode = beneficiary.bank_code
        payload.accountName = beneficiary.account_name
      } else {
        if (!accountName) {
          setError("Please validate the account number and bank")
          setIsSubmitting(false)
          return
        }
        payload.accountNumber = values.accountNumber
        payload.bankCode = values.bankCode
        payload.accountName = accountName
      }
      // Call process transfer API
      const res = await fetch("/api/alat/debit/process-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.message || data.error || "Transfer failed")
        setIsSubmitting(false)
        return
      }
      setSuccess(true)
      setTransactionDetails(data)
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
        <div className="flex flex-col gap-2 mb-2">
          {walletLoading ? (
            <div className="text-sm text-blue-700">Loading account info...</div>
          ) : walletInfo ? (
            <div className="flex flex-col md:flex-row md:items-center md:gap-6 gap-1">
              <div className="text-sm text-gray-700">Account Number: <span className="font-mono font-bold">{walletInfo.walletNumber}</span></div>
              <div className="text-sm text-gray-700">Current Balance: <span className="font-bold">₦{Number(walletInfo.availableBalance).toLocaleString()}</span></div>
            </div>
          ) : walletError ? (
            <div className="text-sm text-red-600">{walletError}</div>
          ) : null}
        </div>
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
        {success && transactionDetails && (
          <Alert variant="default" className="mb-6">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Transfer Successful</AlertTitle>
            <AlertDescription>
              Transfer completed. Reference: {transactionDetails.reference || transactionDetails.transactionId}
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex gap-4">
              <Button
                type="button"
                variant={mode === "beneficiary" ? "default" : "outline"}
                onClick={() => form.setValue("mode", "beneficiary")}
              >
                Choose Beneficiary
              </Button>
              <Button
                type="button"
                variant={mode === "manual" ? "default" : "outline"}
                onClick={() => {
                  form.setValue("mode", "manual")
                  if (banks.length === 0) fetchBanks()
                }}
              >
                Enter Account Number
              </Button>
            </div>
            {mode === "beneficiary" ? (
              <FormField
                control={form.control}
                name="beneficiaryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beneficiary</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={beneficiariesLoading}>
                      <SelectTrigger className="w-full py-2 px-3 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Select a beneficiary" />
                      </SelectTrigger>
                      <SelectContent>
                        {beneficiaries.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.account_name} ({b.bank_name} - {b.account_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={10} placeholder="Enter account number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={banksLoading || !accountNumber || accountNumber.length < 10}
                      >
                        <SelectTrigger className="w-full py-2 px-3 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Select a bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks.map((bank) => (
                            <SelectItem key={bank.code} value={bank.code}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {bank.logo && (
                                  <img src={bank.logo} alt={bank.name} style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4, marginRight: 8 }} />
                                )}
                                {bank.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {accountValidationLoading && <div className="text-sm text-gray-500">Validating account...</div>}
                {accountValidationError && <div className="text-sm text-red-500">{accountValidationError}</div>}
                {accountName && <div className="text-sm text-green-600">Account Name: {accountName}</div>}
              </>
            )}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1000}
                      max={1000000}
                      step={100}
                      placeholder="Enter amount"
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {nipChargeLoading && <div className="text-sm text-gray-500">Fetching NIP charge...</div>}
            {nipChargeError && <div className="text-sm text-red-500">{nipChargeError}</div>}
            {nipCharge !== null && !nipChargeLoading && (
              <div className="text-sm text-blue-600">NIP Charge: ₦{nipCharge.toLocaleString()}</div>
            )}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter reason for transfer" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Transfer"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
