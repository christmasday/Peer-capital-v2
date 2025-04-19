import { redirect } from "next/navigation"
import { getUserProfile } from "@/lib/actions/auth"
import { ProfileEditForm } from "@/components/profile/profile-edit-form"
import { MainLayout } from "@/components/layouts/main-layout"
import { checkAuth } from "@/lib/auth-utils"

export default async function ProfileEditPage() {
  // Check authentication
  await checkAuth()

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>

        <ProfileEditForm profile={userProfile.profile} />
      </div>
    </MainLayout>
  )
}
