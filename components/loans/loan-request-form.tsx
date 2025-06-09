"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { checkAuth } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { getLoanHelperSettings } from "@/lib/actions/loan-helper-settings"

const loanPurposes = [
  { value: "business", label: "Business" },
  { value: "education", label: "Education" },
  { value: "medical", label: "Medical" },
  { value: "personal", label: "Personal" },
  { value: "debt_consolidation", label: "Debt Consolidation" },
  { value: "home_improvement", label: "Home Improvement" },
  { value: "other", label: "Other" },
]

const formSchema = z.object({
  purpose: z.string().min(1, "Please select a purpose"),
  purposeDetails: z.string().min(10, "Please provide more details about your loan purpose"),
})

type FormValues = z.infer<typeof formSchema>

interface LoanRequestFormProps {
  helperId: string
  helperName: string
  interestRate: number
  maxLoanAmount: number
  duration: number
  durationUnit?: string
  user?: any
}

export function LoanRequestForm({ helperId, helperName, interestRate, maxLoanAmount, duration, durationUnit, user }: LoanRequestFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [lenderTerms, setLenderTerms] = useState<string>("")
  const [acceptLenderTerms, setAcceptLenderTerms] = useState(false)
  const [acceptPeerTerms, setAcceptPeerTerms] = useState(false)
  const [termsError, setTermsError] = useState<string | null>(null)

  // NEW: State for fetched duration and unit
  const [fetchedDuration, setFetchedDuration] = useState<number | null>(null)
  const [fetchedDurationUnit, setFetchedDurationUnit] = useState<string | null>(null)

  // Fetch duration/unit from helper settings
  useEffect(() => {
    async function fetchDuration() {
      const { data } = await getLoanHelperSettings(helperId)
      if (data) {
        setFetchedDuration(data.repayment_time)
        setFetchedDurationUnit(data.repayment_unit || "months")
      }
    }
    fetchDuration()
  }, [helperId])

  // Use fetched values if available, otherwise fall back to props
  const lenderAmount = maxLoanAmount
  const lenderDuration = fetchedDuration ?? duration
  const lenderDurationUnit = fetchedDurationUnit ?? durationUnit

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purpose: "",
      purposeDetails: "",
    },
  })

  // Calculate payment and interest based on duration unit
  const calculatePayments = () => {
    const principal = lenderAmount
    let periods = lenderDuration
    let periodInterestRate = 0
    let totalInterest = 0
    let totalPayment = 0
    let monthlyPayment = 0

    if (lenderDurationUnit === "months") {
      periodInterestRate = interestRate / 100 / 12
      // Amortized monthly payment formula
      monthlyPayment =
        (principal * periodInterestRate * Math.pow(1 + periodInterestRate, periods)) /
        (Math.pow(1 + periodInterestRate, periods) - 1)
      totalPayment = monthlyPayment * periods
      totalInterest = totalPayment - principal
    } else if (lenderDurationUnit === "weeks") {
      // Convert annual rate to weekly
      periodInterestRate = interestRate / 100 / 52
      // Amortized weekly payment formula
      monthlyPayment =
        (principal * periodInterestRate * Math.pow(1 + periodInterestRate, periods)) /
        (Math.pow(1 + periodInterestRate, periods) - 1)
      totalPayment = monthlyPayment * periods
      totalInterest = totalPayment - principal
    } else if (lenderDurationUnit === "days") {
      // Convert annual rate to daily
      periodInterestRate = interestRate / 100 / 365
      // Amortized daily payment formula
      monthlyPayment =
        (principal * periodInterestRate * Math.pow(1 + periodInterestRate, periods)) /
        (Math.pow(1 + periodInterestRate, periods) - 1)
      totalPayment = monthlyPayment * periods
      totalInterest = totalPayment - principal
    } else {
      // Default to months
      periodInterestRate = interestRate / 100 / 12
      monthlyPayment =
        (principal * periodInterestRate * Math.pow(1 + periodInterestRate, periods)) /
        (Math.pow(1 + periodInterestRate, periods) - 1)
      totalPayment = monthlyPayment * periods
      totalInterest = totalPayment - principal
    }
    return { monthlyPayment, totalPayment, totalInterest }
  }

  const { monthlyPayment, totalPayment, totalInterest } = calculatePayments()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(value)
  }

  // Fetch lender's terms and conditions
  useEffect(() => {
    async function fetchTerms() {
      const { data } = await getLoanHelperSettings(helperId)
      setLenderTerms(data?.terms_and_conditions || "No terms and conditions provided by lender.")
    }
    if (showTermsModal) fetchTerms()
  }, [helperId, showTermsModal])

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)
      setError(null)

      // Call the API route instead of the server action directly
      const res = await fetch("/api/loan-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          helperId,
          amount: lenderAmount,
          duration: lenderDuration,
          durationUnit: lenderDurationUnit,
          purpose: values.purpose,
          purposeDetails: values.purposeDetails,
          interestRate,
        }),
      })
      const result = await res.json()

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(true)

      // Redirect to loans page after 2 seconds
      setTimeout(() => {
        router.push("/loans")
      }, 2000)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleFormSubmit(values: FormValues) {
    setTermsError(null)
    setShowTermsModal(true)
    // Save form values in state if needed
  }

  async function handleConfirmRequest(values: FormValues) {
    setTermsError(null)
    if (!acceptLenderTerms || !acceptPeerTerms) {
      setTermsError("You must accept both the lender's and Peer Capital's terms and conditions.")
      return
    }
    await onSubmit(values)
    setShowTermsModal(false)
  }

  return (
    <Card className="w-full">
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <Alert className="mb-4">
            <AlertDescription>
              Your loan request has been submitted successfully! You will be redirected to your loans page.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-6"
            >
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-6 mb-2">
                    <span className="text-gray-500 text-sm mb-1">Loan Amount</span>
                    <span className="text-3xl font-bold text-blue-700">{formatCurrency(lenderAmount)}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-6 mb-2">
                    <span className="text-gray-500 text-sm mb-1">Duration</span>
                    <span className="text-3xl font-bold text-blue-700">{lenderDuration} {lenderDurationUnit}</span>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Purpose</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full py-2 px-3 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <SelectValue placeholder="Select purpose" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loanPurposes.map((purpose) => (
                            <SelectItem key={purpose.value} value={purpose.value} className="text-sm">
                              {purpose.label}
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
                  name="purposeDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide details about why you need this loan"
                          className="resize-none w-full py-2 px-3 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Loan Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Interest Rate:</div>
                  <div className="font-medium">{interestRate}% per annum</div>

                  <div className="text-gray-600">Monthly Payment:</div>
                  <div className="font-medium text-gray-900">{formatCurrency(monthlyPayment)}</div>

                  <div className="text-gray-600">Total Payment:</div>
                  <div className="font-medium text-gray-900">{formatCurrency(totalPayment)}</div>

                  <div className="text-gray-600">Total Interest:</div>
                  <div className="font-medium text-gray-900">{formatCurrency(totalInterest)}</div>

                  <div className="text-gray-600">Repayment Duration:</div>
                  <div className="font-medium text-gray-900">{lenderDuration} {lenderDurationUnit}</div>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Loan Request"}
              </Button>
            </form>
            <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Accept Terms and Conditions</DialogTitle>
                </DialogHeader>
                <div className="mb-4">
                  <div className="font-semibold mb-1">Lender's Terms and Conditions</div>
                  <div className="text-xs text-gray-700 mb-2 max-h-32 overflow-y-auto whitespace-pre-line border p-2 rounded bg-gray-50">
                    {lenderTerms}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox id="accept-lender-terms" checked={acceptLenderTerms} onCheckedChange={v => setAcceptLenderTerms(!!v)} />
                    <label htmlFor="accept-lender-terms" className="text-xs">I accept the lender's terms and conditions</label>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="font-semibold mb-1">Peer Capital Terms and Conditions</div>
                  <div className="text-xs text-gray-700 mb-2 max-h-24 overflow-y-auto border p-2 rounded bg-gray-50">
                    By requesting this loan, you agree to Peer Capital's <a href="/terms" target="_blank" className="underline text-blue-600">terms and conditions</a>.
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox id="accept-peer-terms" checked={acceptPeerTerms} onCheckedChange={v => setAcceptPeerTerms(!!v)} />
                    <label htmlFor="accept-peer-terms" className="text-xs">I accept Peer Capital's terms and conditions</label>
                  </div>
                </div>
                {termsError && <div className="text-xs text-red-600 mb-2">{termsError}</div>}
                <DialogFooter className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowTermsModal(false)} disabled={isSubmitting}>Cancel</Button>
                  <Button
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleConfirmRequest(form.getValues())}
                    disabled={isSubmitting || !acceptLenderTerms || !acceptPeerTerms}
                  >
                    {isSubmitting ? "Submitting..." : "Complete Loan Request"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
