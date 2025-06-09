import { redirect } from "next/navigation"
import { TransferForm } from "@/components/account/transfer-form"
import { MainLayout } from "@/components/layouts/main-layout"
import { getUserProfile } from "@/lib/actions/auth"
import { checkAuth } from "@/lib/auth-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Clock, AlertTriangle } from "lucide-react"

export default async function TransferPage() {
  // Check authentication
  await checkAuth()

  // Get user profile
  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  // Get account balance
  const accountBalance = userProfile.account?.balance || 0

  return (
    <MainLayout
      userName={userProfile.profile?.first_name || "User"}
      userImage={userProfile.profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TransferForm currentBalance={accountBalance} />
          </div>

          <div className="space-y-6">
            {/* Account Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Available Balance</p>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: "NGN",
                      }).format(accountBalance)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Loan Balance</p>
                    <p className="text-xl font-semibold text-red-600">
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: "NGN",
                      }).format(userProfile.account?.loan_balance || 0)}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <a
                      href="/transactions"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      View transaction history <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transfer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transfer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Processing Time</p>
                    <p className="text-sm text-gray-500">
                      Transfers are typically processed within 24 hours during business days.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Transfer Limits</p>
                    <p className="text-sm text-gray-500">
                      Minimum: ₦1,000
                      <br />
                      Maximum: ₦1,000,000 per transaction
                      <br />
                      Daily limit: ₦5,000,000
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t text-sm text-gray-500">
                  <p>
                    For transfers above ₦1,000,000, please contact our support team at{" "}
                    <a href="mailto:support@peercapital.com" className="text-blue-600">
                      support@peercapital.com
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
} 