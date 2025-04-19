"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createLoanRequest } from "@/lib/actions/loans"

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
  amount: z.coerce.number().positive("Amount must be positive").min(5000, "Minimum loan amount is ₦5,000"),
  duration: z.coerce.number().int().min(1, "Minimum duration is 1 month").max(36, "Maximum duration is 36 months"),
  purpose: z.string().min(1, "Please select a purpose"),
  purposeDetails: z.string().min(10, "Please provide more details about your loan purpose"),
})

type FormValues = z.infer<typeof formSchema>

interface LoanRequestFormProps {
  helperId: string
  helperName: string
  interestRate: number
  maxLoanAmount: number
}

export function LoanRequestForm({ helperId, helperName, interestRate, maxLoanAmount }: LoanRequestFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 10000,
      duration: 6,
      purpose: "",
      purposeDetails: "",
    },
  })

  const amount = form.watch("amount")
  const duration = form.watch("duration")

  // Calculate monthly payment
  const calculateMonthlyPayment = () => {
    const principal = amount
    const monthlyInterestRate = interestRate / 100 / 12
    const totalPayments = duration

    // Using the formula for monthly payment: P * r * (1 + r)^n / ((1 + r)^n - 1)
    const monthlyPayment =
      (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) /
      (Math.pow(1 + monthlyInterestRate, totalPayments) - 1)

    return isNaN(monthlyPayment) ? 0 : monthlyPayment
  }

  const monthlyPayment = calculateMonthlyPayment()
  const totalPayment = monthlyPayment * duration
  const totalInterest = totalPayment - amount

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(value)
  }

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)
      setError(null)

      if (values.amount > maxLoanAmount) {
        setError(`Maximum loan amount from this helper is ${formatCurrency(maxLoanAmount)}`)
        return
      }

      const result = await createLoanRequest({
        helperId,
        amount: values.amount,
        durationMonths: values.duration,
        purpose: values.purpose,
        purposeDetails: values.purposeDetails,
        interestRate,
      })

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
      console.error("Error submitting loan request:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Request Loan from {helperName}</CardTitle>
      </CardHeader>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Amount (₦)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter amount" {...field} min={5000} max={maxLoanAmount} />
                        </FormControl>
                        <FormDescription>Maximum: {formatCurrency(maxLoanAmount)}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (months)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter duration" {...field} min={1} max={36} />
                        </FormControl>
                        <FormDescription>1-36 months</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Purpose</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select purpose" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loanPurposes.map((purpose) => (
                            <SelectItem key={purpose.value} value={purpose.value}>
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
                          className="resize-none"
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
                  <div className="font-medium">{formatCurrency(monthlyPayment)}</div>

                  <div className="text-gray-600">Total Payment:</div>
                  <div className="font-medium">{formatCurrency(totalPayment)}</div>

                  <div className="text-gray-600">Total Interest:</div>
                  <div className="font-medium">{formatCurrency(totalInterest)}</div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Loan Request"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
