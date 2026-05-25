import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  UserRound,
  Globe,
  Edit,
  Camera,
  Video,
  Calendar,
  MoreHorizontal,
  Settings,
  Sliders,
  Home,
  Rss,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Info,
  User,
  GraduationCap,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FollowButton } from "@/components/profile/follow-button"
import { isFollowingUser } from "@/lib/actions/connections"

// Import the PostItem component and getUserPosts function
import { PostItem } from "@/components/profile/post-item"
import { getUserPosts } from "@/lib/actions/posts"
import { LoanRequestsList } from "@/components/loans/LoanRequestsList"
import { getAllLoanRequests } from "@/lib/actions/loans"
import { getLoanHelperSettings } from "@/lib/actions/loan-helper-settings"

// Import the client component for About tab navigation and content
import PublicProfileAbout from "@/components/profile/PublicProfileAbout"
import { checkAuth } from "@/lib/auth-utils"
import { getUserProfile } from "@/lib/actions/auth"
import { LoanHistorySection } from "@/components/profile/LoanHistorySection"
import { getProfileMetrics } from "@/lib/actions/profile-metrics"
import { ProfileMetricsCard } from "@/components/profile/profile-metrics-card"

export const dynamic = "force-dynamic"

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: { userId: string }
  searchParams: { preview?: string; tab?: string }
}) {
  const { userId } = params
  const isPreviewMode = searchParams.preview === "true"
  const activeTab = searchParams.tab || "overview"

  // Add validation to prevent undefined userId being passed to queries
  if (!userId || userId === "undefined") {
    notFound()
  }

  const cookieStore = cookies()
  const supabase = await createServerClient()
  const adminClient = createAdminClient()

  // Get current user session to determine if viewing own profile
  //const {
  //  data: { session },
  //} = await supabase.auth.getSession()

  await checkAuth()
  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  // Check if this is the user's own profile in preview mode
  const isOwnProfileInPreviewMode = isPreviewMode && userProfile.user?.id === userId

  // For normal viewing
  const isOwnProfile = userProfile.user?.id === userId && !isPreviewMode
  const currentUserId = userProfile.user?.id

  // Try to get user profile with admin client to bypass RLS
  const { data: profile, error } = await adminClient.from("profiles").select("*").eq("id", userId).single()

  if (error || !profile) {
    notFound()
  }

  const profileMetrics = await getProfileMetrics(userId)

  // Get followers and following counts
  const { data: followersCount } = await adminClient
    .from("user_connections")
    .select("id", { count: "exact" })
    .eq("following_id", userId)

  const { data: followingCount } = await adminClient
    .from("user_connections")
    .select("id", { count: "exact" })
    .eq("follower_id", userId)

  // Format name
  const fullName = profile.username ? `@${profile.username}` : `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User"

  // Default banner image if user doesn't have one
  const defaultBannerImage = "/banners/abstract-blue.png"
  const bannerImageUrl = profile.banner_image_url || defaultBannerImage

  // Fetch user's posts
  const postsResult = await getUserPosts(params.userId, 10)
  const posts = postsResult.posts || []
  const postsError = postsResult.error

  if (postsError) {
  }

  const user = userProfile.user

  // Fetch all loan requests for the 'Loan Requests' tab
  let allLoanRequests: any[] = []
  if (activeTab === "loan-requests") {
    const allLoanReqResult = await getAllLoanRequests()
    allLoanRequests = allLoanReqResult.loanRequests || []
  }

  // Fetch loan helper settings for the profile user
  const { data: loanHelperSettings } = await getLoanHelperSettings(userId)

  // Check if the current user has a pending loan request from the profile user
  let showLoanHistoryTab = false;
  if (currentUserId && userId) {
    const { data: pendingLoan } = await adminClient
      .from("loan_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("helper_id", currentUserId)
      .eq("status", "pending")
      .maybeSingle();
    showLoanHistoryTab = !!pendingLoan;
  }

  // Get initial following state for the current user
  let initialFollowingState = false;
  if (currentUserId && userId && currentUserId !== userId) {
    const result = await isFollowingUser(userId);
    initialFollowingState = !!result?.following;
  }

  return (
    <div className="-mt-6">
      {/* Full-width Banner Image */}
      <div className="w-[100vw] relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="w-full h-64 bg-cover bg-center relative" style={{ backgroundImage: `url(${bannerImageUrl})` }}>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-white"></div>

          {/* Profile header content - positioned absolutely to overlay on the banner */}
          <div className="container max-w-6xl relative h-full">
            <div className="absolute -bottom-16 left-8 md:left-12">
              <div className="relative">
                <div className="h-40 w-40 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                  <Avatar className="h-full w-full">
                    {profile.profile_picture_url ? (
                      <AvatarImage
                        src={`${profile.profile_picture_url}?t=${profile.updated_at ? new Date(profile.updated_at).getTime() : Date.now()}`}
                        alt={fullName}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-6xl bg-blue-100">
                        <UserRound className="h-20 w-20 text-blue-500" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {isOwnProfile && (
                    <button className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700">
                      <Camera className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile information section */}
      <div className="container max-w-6xl pt-16 pb-4 flex flex-col px-4 md:px-8">
        <div className="mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{fullName}</h1>
            <div className="flex items-center gap-2 ml-auto">
              <FollowButton userId={userId || ""} initialFollowingState={initialFollowingState} />
              <Link href={`/support-inbox`}>
                <Button variant="outline" className="bg-gray-200 border-gray-300 hover:bg-gray-300 text-black">
                  <span className="mr-2">Contact</span>
                </Button>
              </Link>
            </div>
          </div>
          {/* <div className="mt-1">
            <span className="text-gray-500 text-base">Followed by {followersCount?.length || 0} {followersCount?.length === 1 ? "person" : "people"}</span>
          </div> */}
          {loanHelperSettings && profile.lending_license_url && loanHelperSettings.loan_amount && loanHelperSettings.interest_rate && loanHelperSettings.repayment_time && (
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                Lending Goals
              </span>
              <span className="ml-auto text-xs text-green-900 bg-green-50 px-3 py-1 rounded-md whitespace-nowrap">
                ₦{loanHelperSettings.loan_amount?.toLocaleString()} at {loanHelperSettings.interest_rate}% for {loanHelperSettings.repayment_time} months
              </span>
            </div>
          )}
          <div className="mt-1">
            <span className="text-gray-500 text-base">Followed by {followersCount?.length || 0} {followersCount?.length === 1 ? "person" : "people"}</span>
          </div>
        </div>

        {/* Compact profile metrics under header */}
        <div>
          <ProfileMetricsCard metrics={profileMetrics} compact />
        </div>

        {/* Navigation tabs */}
        <div className="border-b border-gray-300">
          <div className="flex space-x-1 overflow-x-auto justify-center">
            <Link
              href={`/profile/${userId}?tab=about`}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-colors inline-block",
                activeTab === "about"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              )}
            >
              About
            </Link>
            {showLoanHistoryTab && (
              <Link
                href={`/profile/${userId}?tab=loan-history`}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors inline-block",
                  activeTab === "loan-history"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                )}
              >
                Loan History
              </Link>
            )}
            <div className="flex-grow"></div>
          </div>
        </div>

        {/* Main content area with 2-column layout */}
        <div className="grid grid-cols-12 gap-4 mt-4">
          {/* Left sidebar with About tab section links */}
          {activeTab === "about" && (
            <div className="col-span-12 space-y-6">
              <PublicProfileAbout profile={profile} initialSection="about" />
            </div>
                  )}
          {activeTab === "loan-history" && showLoanHistoryTab && (
            <div className="col-span-12">
              <LoanHistorySection userId={userId} />
                </div>
          )}

          {/* Right content area (8/12) */}
          <div className="col-span-8">
            {/* Loan Requests tab */}
            {activeTab === "loan-requests" ? (
              <>
                <h2 className="text-xl font-bold mb-4">All Loan Requests</h2>
                <LoanRequestsList loanRequests={allLoanRequests} currentUserId={currentUserId} />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
