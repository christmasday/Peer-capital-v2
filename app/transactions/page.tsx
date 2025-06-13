import { MainLayout } from "@/components/layouts/main-layout"
import { getUserProfile } from "@/lib/actions/auth"
import { checkAuth } from "@/lib/auth-utils"
import { TransactionsList } from "@/components/transactions/transactions-list"
import { redirect } from "next/navigation"

export default async function TransactionsPage() {
  // Check authentication
  await checkAuth()

  // Get user profile
  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  return (
    <MainLayout
      userName={userProfile.profile?.first_name || "User"}
      userImage={userProfile.profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h1>
        <TransactionsList />
      </div>
    </MainLayout>
  )
}
