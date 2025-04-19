import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { LoanRequestForm } from "@/components/loans/loan-request-form"
import { MainLayout } from "@/components/layouts/main-layout"
import { getUserProfile } from "@/lib/actions/auth"
import { checkAuth } from "@/lib/auth-utils"

export default async function LoanRequestPage({ params }: { params: { helperId: string } }) {
  // Check authentication
  await checkAuth()

  // Get user profile
  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  // Get the helper details
  const supabase = createServerClient()
  const { data: helper, error } = await supabase.from("loan_helpers").select("*").eq("id", params.helperId).single()

  if (error || !helper) {
    redirect("/home")
  }

  return (
    <MainLayout
      userName={userProfile.profile?.first_name || "User"}
      userImage={userProfile.profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Request a Loan</h1>

        <LoanRequestForm
          helperId={helper.id}
          helperName={helper.name}
          interestRate={helper.interest_rate}
          maxLoanAmount={helper.max_loan_amount}
        />
      </div>
    </MainLayout>
  )
}
