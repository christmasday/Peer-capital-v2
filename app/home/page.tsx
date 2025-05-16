import { HomeContent } from "@/components/home/home-content"
import { getUserProfile } from "@/lib/actions/auth"
import { createAdminClient } from "@/lib/supabase/admin"

// Mock data for loan helpers
const mockLoanHelpers = [
  {
    id: "1",
    name: "Ada Ada",
    interest_rate: 0.2,
    max_loan_amount: 2000000,
    loans_issued: 80,
    amount_issued: 50000000,
    profile_image_url: "/vibrant-street-market.png",
  },
  {
    id: "2",
    name: "Don Halbert",
    interest_rate: 0.4,
    max_loan_amount: 5500000,
    loans_issued: 60,
    amount_issued: 35000000,
    profile_image_url: "/vibrant-street-market.png",
  },
]

export default async function HomePage({ searchParams }: { searchParams: { auth?: string } }) {
  // Get user profile - with fallback for direct auth
  let userProfile

  try {
    userProfile = await getUserProfile()
  } catch (error) {
    console.error("Error getting user profile:", error)

    // If direct auth parameter is provided, use a fallback profile
    if (searchParams.auth === "direct") {
      console.log("Using fallback profile for direct auth")

      // Try to get a user from the database as fallback
      const adminClient = createAdminClient()
      const { data: firstUser } = await adminClient.from("profiles").select("*").limit(1).single()

      if (firstUser) {
        userProfile = {
          id: firstUser.id,
          email: firstUser.email,
          profile: firstUser,
        }
      } else {
        // Create a minimal fallback profile
        userProfile = {
          id: "fallback-user",
          email: "user@example.com",
          profile: {
            first_name: "Guest",
            profile_picture_url: "/vibrant-street-market.png",
          },
        }
      }
    } else {
      // Re-throw the error if not using direct auth
      throw error
    }
  }

  // Get loan helpers
  const loanHelpers = mockLoanHelpers

  return <HomeContent userProfile={userProfile} loanHelpers={loanHelpers} />
}
