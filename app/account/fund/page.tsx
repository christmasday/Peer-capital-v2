import { redirect } from "next/navigation"
import { getUserProfile } from "@/lib/actions/auth"
import { MainLayout } from "@/components/layouts/main-layout"
import { FundAccountForm } from "@/components/account/fund-account-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { getCurrentUserId } from "@/lib/auth-utils"

export const metadata = {
  title: "Fund Account | PeerCapital",
  description: "Fund your PeerCapital account",
}

export default async function FundAccountPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  // Get the current user ID
  const userId = await getCurrentUserId()

  if (!userId) {
    // Redirect to login if no user ID is found
    redirect("/login?callbackUrl=/account/fund")
  }

  // Get user profile
  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  // Error messages
  const errorMessages: Record<string, string> = {
    missing_reference: "Payment reference is missing. Please try again.",
    transaction_not_found: "Transaction not found. Please try again.",
    configuration_error: "Payment provider configuration error. Please contact support.",
    balance_update_failed: "Failed to update account balance. Please contact support.",
  }

  const errorMessage = searchParams.error
    ? errorMessages[searchParams.error] || "An error occurred. Please try again."
    : null

  return (
    <MainLayout
      userName={userProfile.profile?.first_name || "User"}
      userImage={userProfile.profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/home">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 ml-2">Fund Your Account</h1>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
                <CardDescription>Your current account details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Balance</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency(userProfile.account?.balance || 0)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Loan Balance</p>
                    <p className="text-lg font-medium text-red-600">
                      {formatCurrency(userProfile.account?.loan_balance || 0)}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-1">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/transactions">
                        <Button variant="outline" size="sm" className="w-full">
                          Transactions
                        </Button>
                      </Link>
                      <Link href="/loans">
                        <Button variant="outline" size="sm" className="w-full">
                          Loans
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Fund Your Account</CardTitle>
                <CardDescription>
                  Add money to your Peer Capital account using your preferred payment method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FundAccountForm userId={userId} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
