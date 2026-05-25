import { redirect } from "next/navigation"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "@/components/layouts/main-layout"
import { LoanOfferResponseButtons } from "@/components/loans/loan-offer-response-buttons"
import { checkAuth } from "@/lib/auth-utils"
import { getLoanOfferById } from "@/lib/actions/loan-offers"
import { getUserProfile } from "@/lib/actions/auth"

export const dynamic = "force-dynamic"

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "offer_pending":
      return "bg-yellow-100 text-yellow-800"
    case "approved":
      return "bg-emerald-100 text-emerald-800"
    case "rejected":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount)
}

export default async function LoanOfferPage({ params }: { params: { loanRequestId: string } }) {
  const auth = await checkAuth(true)
  if (!auth.authenticated || !auth.userId) {
    redirect("/login")
  }

  const userProfile = await getUserProfile()
  if (!userProfile) {
    redirect("/")
  }

  const offerResult = await getLoanOfferById(params.loanRequestId, auth.userId)
  if (!offerResult.success || !offerResult.offer) {
    redirect("/loans")
  }

  const offer = offerResult.offer
  const lenderName = offer.loan_helpers?.name || "Lender"
  const offerStatus = offer.status || "offer_pending"
  const isBorrower = offer.user_id === auth.userId
  const canRespond = isBorrower && offerStatus === "offer_pending"

  return (
    <MainLayout
      userName={userProfile.profile?.username ? `@${userProfile.profile.username}` : userProfile.profile?.first_name || "User"}
      userImage={userProfile.profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Loan Offer</h1>
          <p className="text-sm text-gray-500 mt-1">Review the lender's offer before accepting or rejecting it.</p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-xl">{lenderName}</CardTitle>
                <p className="text-sm text-gray-500">Sent {format(new Date(offer.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
              </div>
              <Badge className={getStatusBadgeClass(offerStatus)}>
                {offerStatus === "offer_pending"
                  ? "Pending offer"
                  : offerStatus.charAt(0).toUpperCase() + offerStatus.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-lg border p-4">
                <p className="text-gray-500">Amount</p>
                <p className="mt-1 text-base font-semibold">{formatCurrency(Number(offer.amount || 0))}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-gray-500">Interest Rate</p>
                <p className="mt-1 text-base font-semibold">{Number(offer.interest_rate || 0)}% per annum</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-gray-500">Duration</p>
                <p className="mt-1 text-base font-semibold">{Number(offer.duration_months || 0)} months</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-gray-500">Purpose</p>
                <p className="mt-1 text-base font-semibold">{offer.purpose}</p>
              </div>
            </div>

            {!canRespond && offerStatus !== "offer_pending" ? (
              <div className="mt-6 rounded-lg bg-muted/40 p-4 text-sm text-gray-600">
                This offer has already been {offerStatus}.
              </div>
            ) : null}

            {canRespond ? (
              <div className="mt-6">
                <LoanOfferResponseButtons loanRequestId={offer.id} />
              </div>
            ) : null}

            {!isBorrower ? (
              <div className="mt-6 rounded-lg bg-muted/40 p-4 text-sm text-gray-600">
                You can view this offer, but only the borrower can respond to it.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" asChild>
            <a href="/loans">Back to loans</a>
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
