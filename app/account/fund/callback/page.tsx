"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUserIdClient } from "@/lib/auth-utils-client"

export default function PaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [transactionDetails, setTransactionDetails] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function verifyPayment() {
      try {
        // Get current user ID using the client-side utility
        const currentUserId = await getCurrentUserIdClient()
        setUserId(currentUserId)

        if (!currentUserId) {
          setStatus("error")
          setMessage("Authentication required. Please log in and try again.")
          return
        }

        const reference = searchParams.get("reference")
        if (!reference) {
          setStatus("error")
          setMessage("No payment reference found.")
          return
        }

        // Verify the payment with our backend
        const response = await fetch(`/api/paystack/verify?reference=${reference}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setStatus("success")
          setTransactionDetails(data.transaction)
        } else {
          setStatus("error")
          setMessage(data.error || "Failed to verify payment. Please contact support.")
        }
      } catch (error) {
        console.error("Error verifying payment:", error)
        setStatus("error")
        setMessage("An unexpected error occurred. Please check your transaction history or contact support.")
      }
    }

    verifyPayment()
  }, [searchParams])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(value)
  }

  return (
    <div className="container max-w-md mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            Payment {status === "loading" ? "Processing" : status === "success" ? "Successful" : "Failed"}
          </CardTitle>
          <CardDescription className="text-center">
            {status === "loading" ? "Please wait while we verify your payment..." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-500">Verifying your payment...</p>
            </div>
          )}

          {status === "success" && transactionDetails && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-800">Funding Successful!</AlertTitle>
              <AlertDescription className="text-green-700">
                <p className="mb-2">Your account has been funded with {formatCurrency(transactionDetails.amount)}.</p>
                <p className="mb-2">New balance: {formatCurrency(transactionDetails.newBalance || 0)}</p>
                <p className="text-xs text-green-600">Transaction Reference: {transactionDetails.reference}</p>
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Payment Verification Failed</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push(status === "success" ? "/home" : "/account/fund")} className="w-full">
            {status === "success" ? (
              <>
                Go to Home <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Try Again"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
