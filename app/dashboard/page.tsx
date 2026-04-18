import { redirect } from "next/navigation"
import { MainLayout } from "@/components/layouts/main-layout"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { getUserProfile } from "@/lib/actions/auth"
import { checkAuth } from "@/lib/auth-utils"
import { FinancialDisclaimer } from "@/components/disclaimers/financial-disclaimer"

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Check authentication
  await checkAuth()

  // Get user profile
  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  const fullName = `${userProfile.profile.first_name || ""} ${userProfile.profile.last_name || ""}`.trim() || userProfile.user.email || "User"

  return (
    <MainLayout
      userName={fullName}
      userImage={userProfile.profile.profile_picture_url || ""}
    >
      <div className="container mx-auto py-8">
        <DashboardOverview />
        <div className="mt-8">
          <FinancialDisclaimer />
        </div>
      </div>
    </MainLayout>
  )
}
