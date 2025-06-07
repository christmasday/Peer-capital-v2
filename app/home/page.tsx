import { HomeContent } from "@/components/home/home-content"
import { getUserProfile } from "@/lib/actions/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkAuth } from "@/lib/auth-utils"
import { getMaxLoanAmountByLender, getTotalAmountGivenByLender } from "@/lib/actions/find-lenders"

export default async function HomePage() {
  // Check authentication
  await checkAuth()

  // Get user profile
  const userProfile = await getUserProfile()

  // Fetch loan offers from followed users
  let loanHelpers: any[] = []
  try {
    const { userId } = await checkAuth()
    if (userId) {
      const adminClient = createAdminClient()
      // Get the list of user IDs the current user is following
      const { data: followingConnections } = await adminClient
        .from("user_connections")
        .select("following_id")
        .eq("follower_id", userId)
        .eq("status", "active")
      const followingIds = (followingConnections || []).map((conn: { following_id: string }) => conn.following_id)
      if (followingIds.length > 0) {
        // Get loan offers from followed users
        const { data: offers } = await adminClient
          .from("loan_helper_settings")
          .select("id, user_id, loan_amount, interest_rate, repayment_time, repayment_unit")
          .in("user_id", followingIds)
        if (offers && offers.length > 0) {
          // For each offer, get profile info
          loanHelpers = await Promise.all(
            offers.map(async (offer: any) => {
              const { data: profileArr } = await adminClient
                .from("profiles")
                .select("first_name, last_name, profile_picture_url")
                .eq("id", offer.user_id)
              const profile = profileArr && profileArr[0]
              // Fetch computed stats from loan_history
              const maxLoanAmount = await getMaxLoanAmountByLender(offer.user_id)
              const totalAmountGiven = await getTotalAmountGivenByLender(offer.user_id)
              return {
                id: offer.user_id,
                name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
                interest_rate: offer.interest_rate || 0,
                max_loan_amount: maxLoanAmount,
                loans_issued: 0, // Optionally fetch
                amount_issued: totalAmountGiven,
                profile_image_url: profile?.profile_picture_url || null,
                rating: 4.5, // Optionally fetch
                loanAmount: offer.loan_amount,
                repaymentTime: offer.repayment_time,
                repaymentUnit: offer.repayment_unit,
              }
            })
          )
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return (
    <HomeContent userProfile={userProfile} loanHelpers={loanHelpers} />
  )
}
