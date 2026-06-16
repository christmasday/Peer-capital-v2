import { MainLayout } from "@/components/layouts/main-layout"
import { TransactionsList } from "@/components/transactions/transactions-list"
import { checkAuth } from "@/lib/auth-utils"
import { getUserProfile } from "@/lib/actions/auth"

export const dynamic = "force-dynamic"

export default async function TransactionsPage() {
  await checkAuth()

  const userProfile = await getUserProfile()
  const fullName = userProfile.profile.username ? `@${userProfile.profile.username}` : `${userProfile.profile.first_name || ""} ${userProfile.profile.last_name || ""}`.trim() || userProfile.user.email || "User"

  return (
    <MainLayout userName={fullName} userImage={userProfile.profile.profile_picture_url || ""}>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-sm text-gray-500 mt-1">All your deposits, payouts, and swaps in one place.</p>
        </div>
        <TransactionsList />
      </div>
    </MainLayout>
  )
}
