import { MainLayout } from "@/components/layouts/main-layout"
import { HomeContent } from "@/components/home/home-content"
import { checkAuth } from "@/lib/auth-utils"
import { getUserProfile } from "@/lib/actions/auth"

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
  // Check authentication, but allow direct auth parameter
  if (searchParams.auth !== "direct") {
    await checkAuth()
  }

  // Get the user profile which includes account balance
  const userProfile = await getUserProfile()

  // Get loan helpers
  const loanHelpers = mockLoanHelpers

  return (
    <MainLayout
      userName={userProfile.profile?.first_name || "User"}
      userImage={userProfile.profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <HomeContent userProfile={userProfile} loanHelpers={loanHelpers} />
    </MainLayout>
  )
}
