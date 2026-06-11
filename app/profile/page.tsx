import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
} from "lucide-react"
import { ProfilePreviewBanner } from "@/components/profile/profile-preview-banner"
import { BannerUploadDialog } from "@/components/profile/banner-upload-dialog"
import { AvatarUploadDialog } from "@/components/profile/avatar-upload-dialog"
import { AuthStateMaintainer } from "@/components/auth/auth-state-maintainer"
import { getUserProfile } from "@/lib/actions/auth"
import { checkAuth } from "@/lib/auth-utils"
import { MainLayout } from "@/components/layouts/main-layout"
import { ProfileAbout } from "@/components/profile/profile-about"
import { ProfileTabs } from "@/components/profile/profile-tabs"
import { getProfileMetrics } from "@/lib/actions/profile-metrics"
import { ProfileMetricsCard } from "@/components/profile/profile-metrics-card"

// Re-render on the server at most every 60s. The page shell (banner,
// metrics, profile header) is shared by all tabs, so caching it makes
// tab navigation feel instant instead of triggering a full server
// roundtrip + DB queries on every click.
export const revalidate = 60

export default async function ProfilePage({ searchParams }: { searchParams: { tab?: string; highlight?: string } }) {
  // Check authentication with a more reliable method
  await checkAuth()

  // Await searchParams since it's a Promise in Next.js 13+
  const params = await searchParams

  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  const profile = userProfile.profile
  const user = userProfile.user

  // Fetch all "shell" data in parallel instead of awaiting each
  // sequentially. This was the biggest source of slowness on the
  // initial page load (and got worse on every tab click).
  const adminClient = createAdminClient()
  const [
    { data: authUser },
    profileMetrics,
  ] = await Promise.all([
    adminClient
      .from("auth_users")
      .select("email_confirmed_at")
      .eq("id", user.id)
      .maybeSingle(),
    getProfileMetrics(user.id),
  ])

  const profileWithVerification = {
    ...profile,
    email_confirmed_at: authUser?.email_confirmed_at || null,
  }

  // Format name
  const fullName = profile.username ? `@${profile.username}` : `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User"

  // Default banner image or user's banner if they have one
  const bannerImage = profile.banner_image_url || "/abstract-geometric-shapes.png"

  // Get active tab from search params or default to "about"
  const activeTab = params?.tab || "about"

  // Build the "about" content once on the server. The other tabs
  // (contacts, loan-requests) are loaded on the client via dynamic
  // imports inside <ProfileTabs/>, so switching to them no longer
  // requires a full server roundtrip.
  const aboutContent = (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="overview">
      {/* Main Content - About details (12/12) */}
      <div className="lg:col-span-12">
        <ProfileAbout profile={profileWithVerification} isCurrentUser={true} initialSection="about" />
      </div>
    </div>
  )

  return (
    <MainLayout userName={fullName} userImage={profile.profile_picture_url}>
      {/* Add the auth state maintainer */}
      <AuthStateMaintainer />

      <ProfilePreviewBanner userId={user.id} />

      {/* Full-width banner with profile image overlay */}
      <div className="relative -mt-6">
        {/* Banner Image - Full Width Implementation */}
        <div className="w-[100vw] relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] h-64 md:h-80 overflow-hidden">
          <div
            className="w-full h-64 md:h-80 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${bannerImage || "/placeholder.svg"})` }}
          >
            {/* Gradient overlay that fades to page background */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-white"></div>

            {/* Banner Edit Button - Now using Dialog with userId explicitly passed */}
            <BannerUploadDialog userId={user.id} currentBannerUrl={profile.banner_image_url} />
          </div>
        </div>

        {/* Container for profile image and action buttons */}
        <div className="container max-w-6xl mx-auto">
          {/* Profile Image with Avatar Upload Dialog */}
          <div className="absolute -bottom-16 left-8 md:left-12">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                {profile.profile_picture_url ? (
                  <AvatarImage src={`${profile.profile_picture_url}?t=${profile.updated_at ? new Date(profile.updated_at).getTime() : Date.now()}`} alt={fullName} />
                ) : (
                  <AvatarFallback className="text-4xl bg-blue-100">
                    <User className="h-16 w-16 text-blue-500" />
                  </AvatarFallback>
                )}
              </Avatar>
              <AvatarUploadDialog userId={user.id} currentAvatarUrl={profile.profile_picture_url} userName={fullName} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto pt-24 pb-12">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            {/* Left side - Name and job info */}
            <div>
              <h1 className="text-3xl font-bold">{fullName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-gray-600">
                {profile.job_title && (
                  <span className="flex items-center">
                    {profile.job_title}
                  </span>
                )}
                {profile.employer_name && <span>at {profile.employer_name}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Compact profile metrics under header */}
        <div>
          <ProfileMetricsCard metrics={profileMetrics} compact />
        </div>

        {/* Tabs (client-side, with dynamic imports + prefetch). Switching
            tabs no longer re-renders the page on the server. */}
        <ProfileTabs
          initialTab={activeTab as "about" | "contacts" | "loan-requests"}
          aboutContent={aboutContent}
          currentUserId={user.id}
          highlight={params?.highlight}
        />
      </div>
    </MainLayout>
  )
}