import { redirect } from "next/navigation"
import { getUserProfile } from "@/lib/actions/auth"
import { MainLayout } from "@/components/layouts/main-layout"
import { ChangePasswordForm } from "@/components/profile/change-password-form"
import { ProfileMenu } from "@/components/profile/profile-menu"
import { checkAuth } from "@/lib/auth-utils"

export default async function ChangePasswordPage() {
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <ProfileMenu />
          </div>

          <div className="md:col-span-3">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
