import { getUserProfile } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { MainLayout } from "@/components/layouts/main-layout"
import { NotificationPreferencesForm } from "@/components/profile/notification-preferences-form"
import { ProfileMenu } from "@/components/profile/profile-menu"
import { checkAuth } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  // Check authentication
  await checkAuth()

  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  return (
    <MainLayout
      userName={userProfile.profile?.username ? `@${userProfile.profile.username}` : userProfile.profile?.first_name || "User"}
      userImage={userProfile.profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Notification Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <ProfileMenu />
          </div>

          <div className="md:col-span-3">
            <NotificationPreferencesForm />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
