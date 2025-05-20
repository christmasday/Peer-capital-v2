import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Settings,
  Briefcase,
  Edit,
  Wallet,
  MoreHorizontal,
  Globe,
  Home,
  Rss,
} from "lucide-react"
import { ProfilePreviewBanner } from "@/components/profile/profile-preview-banner"
import { BannerUploadDialog } from "@/components/profile/banner-upload-dialog"
import { AvatarUploadDialog } from "@/components/profile/avatar-upload-dialog"
import { AuthStateMaintainer } from "@/components/auth/auth-state-maintainer"
import { getUserProfile } from "@/lib/actions/auth"
import { checkAuth } from "@/lib/auth-utils"
import { MainLayout } from "@/components/layouts/main-layout"
import { cn } from "@/lib/utils"
import { EditBioButton } from "@/components/profile/edit-bio-button"
import { CreatePostCard } from "@/components/profile/create-post-card"
import { getUserPosts } from "@/lib/actions/posts"
import { PostsList } from "@/components/profile/posts-list"
import { ProfileAbout } from "@/components/profile/profile-about"
import { ProfilePostsWrapper } from "@/components/profile/profile-posts-wrapper"
import { ConnectionsList } from "@/components/profile/connections-list"
import { getFollowersCount, getFollowingCount } from "@/lib/actions/connections"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ProfilePage({ searchParams }: { searchParams: { tab?: string } }) {
  // Check authentication with a more reliable method
  await checkAuth()

  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  const profile = userProfile.profile
  const user = userProfile.user

  const cookieStore = cookies()
  const supabase = createServerClient()
  const adminClient = createAdminClient()

  // Get account balance
  const { data: accountBalance } = await adminClient
    .from("account_balances")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // Get loan helper settings
  const { data: loanHelperSettings } = await adminClient
    .from("loan_helper_settings")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // Format name
  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User"

  // Default banner image or user's banner if they have one
  const bannerImage = profile.banner_image_url || "/abstract-geometric-shapes.png"

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Fetch user's posts
  const { posts, error: postsError } = await getUserPosts(user.id, 10)

  if (postsError) {
    console.error("Error fetching posts:", postsError)
  }

  // Fetch followers and following counts for friends tab
  const followersResult = await getFollowersCount(user.id)
  const followingResult = await getFollowingCount(user.id)
  const followersCount = followersResult.count || 0
  const followingCount = followingResult.count || 0

  // Get active tab from search params or default to "posts"
  const activeTab = searchParams?.tab || "posts"

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
        <div className="container max-w-6xl">
          {/* Profile Image with Avatar Upload Dialog */}
          <div className="absolute -bottom-16 left-8 md:left-12">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                {profile.profile_picture_url ? (
                  <AvatarImage src={profile.profile_picture_url || "/placeholder.svg"} alt={fullName} />
                ) : (
                  <AvatarFallback className="text-4xl bg-blue-100">
                    <User className="h-16 w-16 text-blue-500" />
                  </AvatarFallback>
                )}
              </Avatar>
              <AvatarUploadDialog userId={user.id} currentAvatarUrl={profile.profile_picture_url} userName={fullName} />
            </div>
          </div>

          {/* Action Buttons - positioned at farthest right */}
          <div className="absolute -bottom-16 right-0 md:right-4 flex gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <span className="mr-1">+</span> Add to story
            </Button>
            <Button asChild variant="outline" className="bg-gray-200 border-gray-300 hover:bg-gray-300 text-black">
              <Link href="/profile/edit">
                <Edit className="mr-2 h-4 w-4" />
                Edit profile
              </Link>
            </Button>
            <Button variant="outline" size="icon" className="bg-gray-200 border-gray-300 hover:bg-gray-300 text-black">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl pt-24 pb-12">
        {/* Profile Header with reorganized layout */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            {/* Left side - Name and job info */}
            <div>
              <h1 className="text-3xl font-bold">{fullName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-gray-600">
                {profile.job_title && (
                  <span className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-1" />
                    {profile.job_title}
                  </span>
                )}
                {profile.employer_name && <span>at {profile.employer_name}</span>}
              </div>
            </div>

            {/* Right side - Loan helper info */}
            {loanHelperSettings && (
              <div className="flex items-center mt-1.5 md:mt-0">
                <div className="flex flex-col items-end">
                  <Badge className="bg-green-500 hover:bg-green-600 mb-1">Loan Helper</Badge>
                  <div className="flex items-center text-sm text-green-700 bg-green-50 px-3 py-1 rounded-md whitespace-nowrap">
                    <Wallet className="h-4 w-4 mr-2" />
                    <span>
                      {formatCurrency(loanHelperSettings.loan_amount)} at {loanHelperSettings.interest_rate}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Facebook-style tabs */}
        <div className="border-b border-gray-300 mb-6">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { name: "Posts", href: "/profile", active: activeTab === "posts" },
              { name: "About", href: "/profile?tab=about", active: activeTab === "about" },
              { name: "Friends", href: "/profile/?tab=friends", active: activeTab === "friends" },
              { name: "More", href: "/profile?tab=more", active: activeTab === "more" },
            ].map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors inline-block",
                  tab.active
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                )}
              >
                {tab.name}
              </Link>
            ))}
            <div className="flex-grow"></div>
            <Button variant="ghost" size="icon" className="text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {activeTab === "friends" ? (
          <ConnectionsList
            userId={user.id}
            initialFollowersCount={followersCount}
            initialFollowingCount={followingCount}
          />
        ) : activeTab === "about" ? (
          <ProfileAbout profile={profile} isCurrentUser={true} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="overview">
            {/* Left Sidebar - About section (4/12) */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Intro</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{profile.bio || "No bio yet"}</p>

                  {/* Replace the Link with our new EditBioButton component */}
                  <EditBioButton userId={user.id} currentBio={profile.bio || ""} />

                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Home className="h-5 w-5 text-gray-500" />
                      <span>
                        Lives in {profile.city || "Lagos"}, {profile.state || "Nigeria"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Rss className="h-5 w-5 text-gray-500" />
                      <span>Followed by {followersCount?.length || 0} people</span>
                    </div>
                    {profile.website && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Globe className="h-5 w-5 text-gray-500" />
                        <a href={profile.website} className="text-blue-600 hover:underline">
                          linktr.ee/mr.obi
                        </a>
                      </div>
                    )}
                  </div>

                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href="/profile/edit">Edit details</Link>
                  </Button>
                </CardContent>
                {profile.profile_picture_url && (
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-3 gap-1 mt-2 w-full">
                      <div className="aspect-square bg-gray-200 rounded overflow-hidden">
                        <img
                          src={profile.profile_picture_url || "/placeholder.svg"}
                          alt="Profile thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Keep the existing About card for additional info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p>{profile.email || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p>{profile.phone_number || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p>
                        {[profile.address, profile.city, profile.state, profile.country].filter(Boolean).join(", ") ||
                          "Not provided"}
                      </p>
                    </div>
                  </div>

                  {profile.employment_status && (
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Employment</p>
                        <p>
                          {profile.employment_status}
                          {profile.employer_name && ` at ${profile.employer_name}`}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Loan Helper Settings Card - Keep if it exists */}
              {loanHelperSettings && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Loan Helper Settings</CardTitle>
                      <Link href="/profile/loan-helper">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col p-4 border rounded-lg">
                        <span className="text-sm text-muted-foreground">Maximum Loan Amount</span>
                        <span className="text-2xl font-bold">₦{loanHelperSettings.loan_amount?.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col p-4 border rounded-lg">
                        <span className="text-sm text-muted-foreground">Interest Rate</span>
                        <span className="text-2xl font-bold">{loanHelperSettings.interest_rate}%</span>
                      </div>
                      <div className="flex flex-col p-4 border rounded-lg">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className="mt-1">
                          <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content - Posts section (8/12) */}
            <div className="lg:col-span-8">
              {/* Create post card and posts list now handled by ProfilePostsWrapper */}
              <ProfilePostsWrapper
                userId={user.id}
                userName={fullName}
                userImage={profile.profile_picture_url}
                initialPosts={posts || []}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
