import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { getUserLoanRequests } from "@/lib/actions/loans"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CancelLoanButton } from "@/components/loans/cancel-loan-button"
import { MainLayout } from "@/components/layouts/main-layout"
import { getUserProfile } from "@/lib/actions/auth"
import { checkAuth } from "@/lib/auth-utils"
// Import the FinancialDisclaimer component
import { FinancialDisclaimer } from "@/components/disclaimers/financial-disclaimer"

export const dynamic = "force-dynamic"

export default async function LoansPage() {
  // Check authentication
  await checkAuth()

  // Get user profile
  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  // Get the user's loan requests
  const { loanRequests, error } = await getUserLoanRequests()

  if (error) {
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "offer_pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <MainLayout
      userName={userProfile.profile?.username ? `@${userProfile.profile.username}` : userProfile.profile?.first_name || "User"}
      userImage={userProfile.profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-4xl mx-auto">
        {/* Add the disclaimer at the top of the page content, before the loans list */}
        <div className="mb-6">
          <FinancialDisclaimer />
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Loans</h1>
          <Link href="/home">
            <Button variant="outline" size="sm">
              Find Lenders
            </Button>
          </Link>
        </div>

        {loanRequests && loanRequests.length > 0 ? (
          <div className="space-y-4">
            {loanRequests.map((loan: any) => (
              <Card key={loan.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden">
                        <Image
                          src={loan.loan_helpers?.profile_image_url || "/placeholder.svg?height=100&width=100"}
                          alt={loan.loan_helpers?.name || "Lender"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{loan.loan_helpers?.name || "Lender"}</CardTitle>
                        <p className="text-sm text-gray-500">{format(new Date(loan.created_at), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(loan.status)}>
                      {loan.status === "offer_pending"
                        ? "Pending Offer"
                        : loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="text-sm text-gray-500">Amount:</div>
                    <div className="text-sm font-medium">{formatCurrency(loan.amount)}</div>

                    <div className="text-sm text-gray-500">Interest Rate:</div>
                    <div className="text-sm font-medium">{loan.interest_rate}% per annum</div>

                    <div className="text-sm text-gray-500">Duration:</div>
                    <div className="text-sm font-medium">{loan.duration_months} months</div>

                    <div className="text-sm text-gray-500">Purpose:</div>
                    <div className="text-sm font-medium">{loan.purpose}</div>
                  </div>

                  {loan.status === "offer_pending" ? (
                    <div className="flex justify-end">
                      <Link href={`/loan-offers/${loan.id}`}>
                        <Button>View this offer</Button>
                      </Link>
                    </div>
                  ) : loan.status === "pending" ? (
                    <CancelLoanButton loanId={loan.id} />
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-medium mb-2">No Loan Requests</h3>
                <p className="text-gray-500 mb-4">
                  You haven't requested any loans yet. Browse lenders and request a loan to get started.
                </p>
                <Link href="/home">
                  <Button>Find Lenders</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
