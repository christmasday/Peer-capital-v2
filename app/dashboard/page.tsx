import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AccountBalanceDisplay from "@/components/account-balance-display"
import { FinancialDisclaimer } from "@/components/disclaimers/financial-disclaimer"
import { checkAuth } from "@/lib/auth-utils"


export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
 await checkAuth()
 
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="mb-6">
        <FinancialDisclaimer />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AccountBalanceDisplay />
        {/* Other dashboard components can go here */}
      </div>
    </div>
  )
}
