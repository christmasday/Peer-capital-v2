import { getUserProfile } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { MainLayout } from "@/components/layouts/main-layout"
import { NotificationPreferencesForm } from "@/components/profile/notification-preferences-form"
import { checkAuth } from "@/lib/auth-utils"

export default async function NotificationsPage() {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Notification Settings</h1>
        <NotificationPreferencesForm />
      </div>
    </MainLayout>
  )
}
