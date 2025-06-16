"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CreditCard, Landmark, Smartphone, AlertCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCurrentUserIdClient } from "@/lib/auth-utils-client"
import { getJWTFromStorage } from "@/lib/jwt-client"

const formSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be positive")
    .min(100, "Minimum funding amount is ₦100")
    .max(10000000, "Maximum funding amount is ₦10,000,000"),
  paymentMethod: z.enum(["card", "bank_transfer"], {
    required_error: "Please select a payment method",
  }),
})

type FormValues = z.infer<typeof formSchema>

export function FundAccountForm({ userId: initialUserId }: { userId?: string }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(initialUserId || null)

  useEffect(() => {
    // If userId is not provided as a prop, try to get it from client-side
    if (!userId) {
      getCurrentUserIdClient().then((id) => {
        if (id) {
          setUserId(id)
        }
      })
    }
  }, [userId])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 1000,
      paymentMethod: "card",
    },
  })

  // Calculate 2% fee, capped at 2100
  const calculateFee = (amount: number) => {
    const fee = amount * 0.02;
    return fee > 2100 ? 2100 : Math.round(fee);
  };

  const amountValueRaw = form.watch("amount") || 0;
  const amountValue = typeof amountValueRaw === 'string' ? Number(amountValueRaw) : amountValueRaw;
  const fee = calculateFee(amountValue);
  const total = amountValue + fee;

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      // If we don't have a userId yet, try to get it one more time
      const currentUserId = userId || (await getCurrentUserIdClient())

      if (!currentUserId) {
        setError("Authentication required. Please log in and try again.")
        sessionStorage.setItem("redirectAfterLogin", "/account/fund")
        router.push("/login")
        setIsSubmitting(false)
        return
      }

      // Convert total (amount + fee) to kobo (Paystack uses kobo)
      const totalInKobo = Math.round((values.amount + calculateFee(values.amount)) * 100)

      // Get any stored JWT from localStorage to include in the request
      const storedJWT = getJWTFromStorage()

      // Initialize Paystack transaction
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include JWT in Authorization header if available
          ...(storedJWT ? { Authorization: `Bearer ${storedJWT}` } : {}),
        },
        body: JSON.stringify({
          amount: totalInKobo,
          paymentMethod: values.paymentMethod,
          userId: currentUserId, // Include the user ID directly in the request
        }),
        // Include credentials to send cookies with the request
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          setError("Authentication required. Please log in and try again.")

          // Store the intended destination for after login
          sessionStorage.setItem("redirectAfterLogin", "/account/fund")

          // Redirect to login
          router.push("/login")
          return
        }

        setError(data.error || "Failed to initialize payment")
        setIsSubmitting(false)
        return
      }

      // Redirect to Paystack payment page
      window.location.href = data.authorizationUrl
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
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
                          <span className={`font-medium ${field.value === "card" ? "text-blue-600" : "text-gray-700"}`}>
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
              <div className="font-medium text-right">{formatCurrency(amountValue)}</div>

              <div className="text-gray-600">Fee (2%):</div>
              <div className="font-medium text-right">{formatCurrency(fee)}</div>

              <div className="text-gray-600 font-medium pt-2 border-t">Total:</div>
              <div className="font-bold text-right pt-2 border-t">{formatCurrency(total)}</div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              "Proceed to Payment"
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
