import { redirect } from "next/navigation"
import { getUserProfile } from "@/lib/actions/auth"
import { ProfileEditForm } from "@/components/profile/profile-edit-form"
import { MainLayout } from "@/components/layouts/main-layout"
import { ProfileMenu } from "@/components/profile/profile-menu"
import { checkAuth } from "@/lib/auth-utils"
import { executeProfileMigration } from "@/lib/actions/execute-migration"

export const dynamic = "force-dynamic"

export default async function ProfileEditPage({ searchParams }: { searchParams: { tab?: string } }) {
  // Check authentication
  await checkAuth()

  // Get user profile
  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  // Try to execute the migration to ensure the columns exist
  // This is a defensive measure in case the migration hasn't been applied
  try {
    await executeProfileMigration()
  } catch (error) {
    console.error("Error executing profile migration:", error)
    // Continue anyway, we'll handle missing columns in the updateProfile function
  }

  // Get the active tab from search params
  const activeTab = searchParams.tab || "personal"

  return (
    <MainLayout
      userName={userProfile.profile?.first_name || "User"}
      userImage={userProfile.profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <ProfileMenu />
          </div>

          <div className="md:col-span-3">
            <ProfileEditForm profile={userProfile.profile} initialTab={activeTab} />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
