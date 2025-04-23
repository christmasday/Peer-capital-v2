"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CreditCard, Landmark, Smartphone, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fundAccount } from "@/lib/actions/account"

const formSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be positive")
    .min(500, "Minimum funding amount is ₦500")
    .max(10000000, "Maximum funding amount is ₦10,000,000"),
  paymentMethod: z.enum(["card", "bank_transfer", "ussd", "mobile_money"], {
    required_error: "Please select a payment method",
  }),
})

type FormValues = z.infer<typeof formSchema>

export function FundAccountForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    error?: string
    transactionId?: string
    reference?: string
    newBalance?: number
  } | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 1000,
      paymentMethod: "card",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setResult(null)

    try {
      const result = await fundAccount({
        amount: values.amount,
        paymentMethod: values.paymentMethod,
      })

      if (result.error) {
        setResult({ error: result.error })
      } else {
        setResult({
          success: true,
          transactionId: result.transactionId,
          reference: result.reference,
          newBalance: result.newBalance,
        })

        // Reset form
        form.reset()

        // Refresh the page data
        router.refresh()
      }
    } catch (error) {
      setResult({
        error: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(value)
  }

  return (
    <div className="max-w-md mx-auto">
      {result?.success ? (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Funding Successful!</AlertTitle>
          <AlertDescription className="text-green-700">
            <p className="mb-2">Your account has been funded with {formatCurrency(form.getValues("amount"))}.</p>
            <p className="mb-2">New balance: {formatCurrency(result.newBalance || 0)}</p>
            <p className="text-xs text-green-600">Transaction Reference: {result.reference}</p>
            <div className="mt-4">
              <Button onClick={() => router.push("/home")} className="w-full">
                Go to Home <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {result?.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Fund</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                      <Input type="number" placeholder="Enter amount" className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <Card
                        className={`cursor-pointer border-2 ${field.value === "card" ? "border-blue-600" : "border-gray-200"}`}
                      >
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                          <RadioGroupItem value="card" id="card" className="sr-only" />
                          <Label htmlFor="card" className="cursor-pointer flex flex-col items-center">
                            <CreditCard
                              className={`h-8 w-8 mb-2 ${field.value === "card" ? "text-blue-600" : "text-gray-500"}`}
                            />
                            <span
                              className={`font-medium ${field.value === "card" ? "text-blue-600" : "text-gray-700"}`}
                            >
                              Card
                            </span>
                          </Label>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer border-2 ${field.value === "bank_transfer" ? "border-blue-600" : "border-gray-200"}`}
                      >
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                          <RadioGroupItem value="bank_transfer" id="bank_transfer" className="sr-only" />
                          <Label htmlFor="bank_transfer" className="cursor-pointer flex flex-col items-center">
                            <Landmark
                              className={`h-8 w-8 mb-2 ${field.value === "bank_transfer" ? "text-blue-600" : "text-gray-500"}`}
                            />
                            <span
                              className={`font-medium ${field.value === "bank_transfer" ? "text-blue-600" : "text-gray-700"}`}
                            >
                              Bank Transfer
                            </span>
                          </Label>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer border-2 ${field.value === "ussd" ? "border-blue-600" : "border-gray-200"}`}
                      >
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                          <RadioGroupItem value="ussd" id="ussd" className="sr-only" />
                          <Label htmlFor="ussd" className="cursor-pointer flex flex-col items-center">
                            <Smartphone
                              className={`h-8 w-8 mb-2 ${field.value === "ussd" ? "text-blue-600" : "text-gray-500"}`}
                            />
                            <span
                              className={`font-medium ${field.value === "ussd" ? "text-blue-600" : "text-gray-700"}`}
                            >
                              USSD
                            </span>
                          </Label>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer border-2 ${field.value === "mobile_money" ? "border-blue-600" : "border-gray-200"}`}
                      >
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                          <RadioGroupItem value="mobile_money" id="mobile_money" className="sr-only" />
                          <Label htmlFor="mobile_money" className="cursor-pointer flex flex-col items-center">
                            <Smartphone
                              className={`h-8 w-8 mb-2 ${field.value === "mobile_money" ? "text-blue-600" : "text-gray-500"}`}
                            />
                            <span
                              className={`font-medium ${field.value === "mobile_money" ? "text-blue-600" : "text-gray-700"}`}
                            >
                              Mobile Money
                            </span>
                          </Label>
                        </CardContent>
                      </Card>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Transaction Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Amount:</div>
                <div className="font-medium text-right">{formatCurrency(form.watch("amount") || 0)}</div>

                <div className="text-gray-600">Fee:</div>
                <div className="font-medium text-right">₦0.00</div>

                <div className="text-gray-600 font-medium pt-2 border-t">Total:</div>
                <div className="font-bold text-right pt-2 border-t">{formatCurrency(form.watch("amount") || 0)}</div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Fund Account"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  )
}
