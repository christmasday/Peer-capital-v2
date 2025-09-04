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
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <TransferForm currentBalance={accountBalance} />
          </div>

          <div className="space-y-6 text-center">
            {/* Account Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-center">Account Summary</CardTitle>
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

            {/* Transfer Information removed per request */}
          </div>
        </div>
      </div>
    </MainLayout>
  )
} 