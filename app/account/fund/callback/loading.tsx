import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function PaymentCallbackLoading() {
  return (
    <div className="container max-w-md mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Payment Processing</CardTitle>
          <CardDescription className="text-center">Please wait while we verify your payment...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500 text-center">
            We're confirming your payment with our payment provider.
            <br />
            This may take a few moments.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
