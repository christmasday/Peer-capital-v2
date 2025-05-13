import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  UserRound,
  Mail,
  Calendar,
  MapPin,
  Briefcase,
  Phone,
  Shield,
  Award,
  CreditCard,
  Share2,
  Flag,
  MessageSquare,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Users,
  UserPlus,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { FollowButton } from "@/components/profile/follow-button"
import { ConnectionsList } from "@/components/profile/connections-list"
import { isFollowingUser, getFollowersCount, getFollowingCount } from "@/lib/actions/connections"
import { MutualConnections } from "@/components/profile/mutual-connections"
import { getMutualConnections } from "@/lib/actions/mutual-connections"
import { cn } from "@/lib/utils"

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
    console.error("Invalid user ID provided:", userId)
    notFound()
  }

  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const adminClient = createAdminClient()

  // Get current user session to determine if viewing own profile
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if this is the user's own profile in preview mode
  const isOwnProfileInPreviewMode = isPreviewMode && session?.user?.id === userId

  // For normal viewing
  const isOwnProfile = session?.user?.id === userId && !isPreviewMode
  const currentUserId = session?.user?.id

  // Try to get user profile with admin client to bypass RLS
  const { data: profile, error } = await adminClient.from("profiles").select("*").eq("id", userId).single()

  if (error || !profile) {
    console.error("Error fetching user profile:", error)
    notFound()
  }

  // Fetch loan helper settings if they exist
  const { data: loanHelperSettings } = await adminClient
    .from("loan_helper_settings")
    .select("*")
    .eq("user_id", userId)
    .single()

  // Fetch account balance
  const { data: accountBalance } = await adminClient.from("account_balances").select("*").eq("user_id", userId).single()

  // Fetch loan requests (both as borrower and helper) - only if viewing own profile
  const loanRequests = isOwnProfile
    ? (
        await adminClient
          .from("loan_requests")
          .select("*")
          .or(`user_id.eq.${userId},helper_id.eq.${userId}`)
          .order("created_at", { ascending: false })
          .limit(5)
      ).data || []
    : []

  // Fetch recent transactions - only if viewing own profile
  const transactions = isOwnProfile
    ? (
        await adminClient
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5)
      ).data || []
    : []

  // Check if the current user is following this profile
  let isFollowing = false
  if (currentUserId && !isOwnProfile && !isOwnProfileInPreviewMode) {
    const followingResult = await isFollowingUser(userId)
    isFollowing = followingResult.following || false
  }

  // Get followers and following counts
  const followersResult = await getFollowersCount(userId)
  const followingResult = await getFollowingCount(userId)
  const followersCount = followersResult.count || 0
  const followingCount = followingResult.count || 0

  // Get mutual connections if viewing someone else's profile
  let mutualConnections = { connections: [], count: 0 }
  if (!isOwnProfile && !isOwnProfileInPreviewMode) {
    mutualConnections = await getMutualConnections(userId)
  }

  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Calculate profile completion percentage
  const requiredFields = [
    "first_name",
    "last_name",
    "email",
    "phone_number",
    "address",
    "city",
    "state",
    "country",
    "profile_picture_url",
  ]
  const completedFields = requiredFields.filter((field) => !!profile[field])
  const profileCompletionPercentage = Math.round((completedFields.length / requiredFields.length) * 100)

  // Determine verification status
  const isVerified = profile.id_verified === true

  // Default banner image if user doesn't have one
  const defaultBannerImage = "/banners/abstract-blue.png"
  const bannerImageUrl = profile.banner_image_url || defaultBannerImage

  // Define tabs
  const tabs = [
    { name: "Overview", value: "overview" },
    { name: "Connections", value: "connections" },
    { name: "Reviews", value: "reviews" },
  ]

  // Add conditional tabs for own profile
  if (isOwnProfile && !isOwnProfileInPreviewMode) {
    tabs.splice(1, 0, { name: "Loans", value: "loans" }, { name: "Transactions", value: "transactions" })
  }

  return (
    <div className="-mt-[4rem]">
      {/* Preview Mode Banner - only show if in preview mode */}
      {isOwnProfileInPreviewMode && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-2 px-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="font-medium">Preview Mode: Viewing your profile as others see it</span>
          </div>
          <Link href="/profile">
            <Button variant="outline" size="sm" className="bg-white text-amber-600 hover:bg-amber-50 border-white">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Exit Preview
            </Button>
          </Link>
        </div>
      )}

      {/* Full-width Banner Image - positioned absolutely to break out of any container constraints */}
      <div className="w-[100vw] relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] mt-[4rem]">
        <div className="w-full h-48 md:h-64 bg-cover bg-center" style={{ backgroundImage: `url(${bannerImageUrl})` }}>
          {/* Gradient overlay that fades to page background */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-white w-full h-48 md:h-64"></div>
        </div>
      </div>

      <div className="container max-w-5xl pb-8">
        <Card className="mb-6 -mt-16 md:-mt-24 relative z-10">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative -mt-16">
                <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                  {profile.profile_picture_url ? (
                    <AvatarImage src={profile.profile_picture_url || "/placeholder.svg"} alt={fullName || "User"} />
                  ) : (
                    <AvatarFallback className="text-2xl bg-blue-100">
                      <UserRound className="h-12 w-12 text-blue-500" />
                    </AvatarFallback>
                  )}
                </Avatar>
                {isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1 rounded-full">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <CardTitle className="text-2xl">{fullName || "User"}</CardTitle>
                  {loanHelperSettings && (
                    <Badge className="ml-0 md:ml-2 bg-blue-500 hover:bg-blue-600">Loan Helper</Badge>
                  )}
                  {isVerified && <Badge className="ml-0 md:ml-2 bg-green-500 hover:bg-green-600">Verified</Badge>}
                </div>

                <div className="flex flex-col md:flex-row gap-4 text-muted-foreground mt-2">
                  {profile.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>{profile.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {memberSince}</span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <Link href={`/profile/${userId}/connections?tab=followers`} className="hover:underline">
                      <span className="font-medium">{followersCount}</span> Followers
                    </Link>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserPlus className="h-4 w-4 text-blue-500" />
                    <Link href={`/profile/${userId}/connections?tab=following`} className="hover:underline">
                      <span className="font-medium">{followingCount}</span> Following
                    </Link>
                  </div>
                </div>

                {isOwnProfile && !isOwnProfileInPreviewMode && (
                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      Profile completion: {profileCompletionPercentage}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${profileCompletionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 mt-4 md:mt-0">
                {/* Show different buttons based on whether it's own profile or preview mode */}
                {isOwnProfile && !isOwnProfileInPreviewMode && (
                  <>
                    <Button asChild>
                      <Link href="/profile/edit">Edit Profile</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/profile/${userId}?preview=true`}>
                        <Users className="h-4 w-4 mr-1.5" />
                        Preview Profile
                      </Link>
                    </Button>
                  </>
                )}

                {(!isOwnProfile || isOwnProfileInPreviewMode) && (
                  <>
                    {/* Only show message button if it's not the user's own profile and not in preview mode */}
                    {!isOwnProfile && !isOwnProfileInPreviewMode && (
                      <Button className="flex gap-2 items-center" asChild>
                        <Link href={`/messages/${userId}`}>
                          <MessageSquare className="h-4 w-4" />
                          Message
                        </Link>
                      </Button>
                    )}
                    {!isOwnProfileInPreviewMode && <FollowButton userId={userId} initialFollowingState={isFollowing} />}
                    {isOwnProfileInPreviewMode && (
                      <Button variant="outline" disabled>
                        <UserPlus className="h-4 w-4 mr-1.5" />
                        Follow
                      </Button>
                    )}
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" title="Share Profile">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Report User">
                        <Flag className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Show mutual connections if viewing someone else's profile and there are mutual connections */}
        {!isOwnProfile && !isOwnProfileInPreviewMode && mutualConnections.count > 0 && (
          <MutualConnections
            connections={mutualConnections.connections}
            count={mutualConnections.count}
            userId={userId}
          />
        )}

        {/* Facebook-style tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <Link
                key={tab.value}
                href={`/profile/${userId}?tab=${tab.value}`}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors inline-block",
                  activeTab === tab.value
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                )}
              >
                {tab.name}
              </Link>
            ))}
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">About</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.bio ? <p>{profile.bio}</p> : <p className="text-muted-foreground italic">No bio provided</p>}

                  <Separator className="my-6" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                      <dl className="space-y-3">
                        {profile.phone_number && (
                          <div className="flex items-start gap-2">
                            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                              <dd>{profile.phone_number}</dd>
                            </div>
                          </div>
                        )}

                        {(profile.address || profile.city || profile.state) && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                              <dd>
                                {[profile.address, profile.city, profile.state, profile.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </dd>
                            </div>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Employment Information */}
                    {profile.employment_status && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Employment</h3>
                        <dl className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Employment</dt>
                              <dd>{profile.employment_status}</dd>
                              {profile.employer_name && (
                                <dd className="text-sm text-muted-foreground">
                                  {profile.job_title ? `${profile.job_title} at ` : ""}
                                  {profile.employer_name}
                                </dd>
                              )}
                            </div>
                          </div>
                        </dl>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Account Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    {isOwnProfile && !isOwnProfileInPreviewMode && accountBalance && (
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Account Balance</dt>
                          <dd className="text-xl font-semibold">₦{accountBalance.balance?.toLocaleString() || 0}</dd>
                        </div>
                      </div>
                    )}

                    {loanHelperSettings && (
                      <>
                        <div className="flex items-start gap-2">
                          <CreditCard className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Loan Amount</dt>
                            <dd className="font-semibold">
                              Up to ₦{loanHelperSettings.loan_amount?.toLocaleString() || 0}
                            </dd>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Award className="h-5 w-5 text-amber-500 mt-0.5" />
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Interest Rate</dt>
                            <dd className="font-semibold">{loanHelperSettings.interest_rate || 0}%</dd>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Verification Status</dt>
                        <dd className="font-semibold">
                          {isVerified ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Verified
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" /> Not Verified
                            </span>
                          )}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {(!isOwnProfile || isOwnProfileInPreviewMode) && loanHelperSettings && (
                <Button className="w-full mt-4 bg-green-600 hover:bg-green-700" asChild>
                  <Link href={`/loans/request/${userId}`} className="flex items-center justify-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Request Loan
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}

        {activeTab === "loans" && isOwnProfile && !isOwnProfileInPreviewMode && (
          <Card>
            <CardHeader>
              <CardTitle>Loan History</CardTitle>
            </CardHeader>
            <CardContent>
              {loanRequests && loanRequests.length > 0 ? (
                <div className="space-y-4">
                  {loanRequests.map((loan) => (
                    <div key={loan.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {loan.user_id === userId ? "Borrowed" : "Lent"} ₦{loan.amount.toLocaleString()}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(loan.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm mt-1">Purpose: {loan.purpose}</p>
                        </div>
                        <Badge
                          className={
                            loan.status === "approved"
                              ? "bg-green-500"
                              : loan.status === "pending"
                                ? "bg-amber-500"
                                : loan.status === "rejected"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                          }
                        >
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">No loan history available</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "transactions" && isOwnProfile && !isOwnProfileInPreviewMode && (
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}: ₦
                            {transaction.amount.toLocaleString()}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm mt-1">{transaction.description}</p>
                        </div>
                        <Badge
                          className={
                            transaction.status === "completed"
                              ? "bg-green-500"
                              : transaction.status === "pending"
                                ? "bg-amber-500"
                                : transaction.status === "failed"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                          }
                        >
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">No transaction history available</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "connections" && (
          <ConnectionsList
            userId={userId}
            initialFollowersCount={followersCount}
            initialFollowingCount={followingCount}
          />
        )}

        {activeTab === "reviews" && (
          <Card>
            <CardHeader>
              <CardTitle>Reviews & Testimonials</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-6">No reviews available yet</p>

              {(!isOwnProfile || isOwnProfileInPreviewMode) && !isOwnProfileInPreviewMode && (
                <div className="text-center mt-4">
                  <Button>Write a Review</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
