import { createServerClient } from "@/lib/supabase/server"
import { VirtualAccountButton } from "@/components/profile/virtual-account-button"
import { getVirtualAccount } from "@/lib/actions/paystack"
import { redirect } from "next/navigation"

export default async function VirtualAccountPage() {
  const supabase = createServerClient()
  const { data: sessionData } = await supabase.auth.getSession()

  // Try to get user ID from session
  let userId = sessionData.session?.user?.id

  // If no user ID from session, try to get from auth utils
  if (!userId) {
    const { getCurrentUserId } = await import("@/lib/auth-utils")
    userId = await getCurrentUserId()
  }

  // If still no user ID, redirect to login
  if (!userId) {
    redirect("/login?redirect=/profile/virtual-account")
    return null
  }

  const { virtualAccount, error } = await getVirtualAccount(userId)

  if (error) {
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-2xl font-bold">Virtual Account</h1>
      <VirtualAccountButton userId={userId} existingAccount={virtualAccount} />
    </div>
  )
}
