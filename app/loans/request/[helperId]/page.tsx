import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { LoanRequestForm } from "@/components/loans/loan-request-form"
import { MainLayout } from "@/components/layouts/main-layout"
import { getUserProfile } from "@/lib/actions/auth"
import { checkAuth } from "@/lib/auth-utils"
// Import the FinancialDisclaimer component
import { FinancialDisclaimer } from "@/components/disclaimers/financial-disclaimer"
import { createAdminClient } from "@/lib/supabase/admin"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export default async function LoanRequestPage({ params }: { params: { helperId: string } }) {
  // Check authentication
  await checkAuth()

  // Get user profile
  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  // Get the helper details
  const supabase = await createServerClient() as SupabaseClient<Database>
  // Fetch helper from loan_helpers
  const { data: helper, error } = await supabase.from("loan_helpers").select("*").eq("id", params.helperId).single()

  if (error || !helper) {
    redirect("/home")
  }

  // Fetch helper's loan settings from loan_helper_settings using admin client
  const adminClient = createAdminClient() as SupabaseClient<Database>
  const { data: settings } = await adminClient
    .from('loan_helper_settings')
    .select('repayment_time, repayment_unit, loan_amount, interest_rate')
    .eq('user_id', helper.user_id)
    .maybeSingle()


  return (
    <MainLayout
      userName={userProfile.profile?.first_name || "User"}
      userImage={userProfile.profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Request a Loan</h1>

        {/* Add the disclaimer before the loan request form */}
        {/* Inside the main content div, add: */}
        <div className="mb-6">
          <FinancialDisclaimer variant="compact" />
        </div>

        <LoanRequestForm
          helperId={helper.id}
          helperName={helper.name}
          interestRate={settings?.interest_rate ?? helper.interest_rate}
          maxLoanAmount={settings?.loan_amount ?? helper.max_loan_amount}
          duration={settings?.repayment_time && settings.repayment_time > 0 ? settings.repayment_time : 1}
          durationUnit={settings?.repayment_unit || "months"}
        />
      </div>
    </MainLayout>
  )
}
