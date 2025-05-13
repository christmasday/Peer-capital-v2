import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, MapPin, Settings, Briefcase, Building, Edit, Wallet } from "lucide-react"
import { ProfilePreviewBanner } from "@/components/profile/profile-preview-banner"
import { VirtualAccountTransactions } from "@/components/profile/virtual-account-transactions"
import { BannerUploadDialog } from "@/components/profile/banner-upload-dialog"
import { AvatarUploadDialog } from "@/components/profile/avatar-upload-dialog"
import { AuthStateMaintainer } from "@/components/auth/auth-state-maintainer"
import { getUserProfile } from "@/lib/actions/auth"
import { checkAuth } from "@/lib/auth-utils"
import { format } from "date-fns"
import { MainLayout } from "@/components/layouts/main-layout"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  // Check authentication with a more reliable method
  await checkAuth()

  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  const profile = userProfile.profile
  const user = userProfile.user

  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
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

  // Get virtual account
  const { data: virtualAccount } = await adminClient
    .from("virtual_accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  // Get followers and following counts
  const { data: followersCount } = await adminClient
    .from("user_connections")
    .select("id", { count: "exact" })
    .eq("following_id", user.id)

  const { data: followingCount } = await adminClient
    .from("user_connections")
    .select("id", { count: "exact" })
    .eq("follower_id", user.id)

  // Format name
  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User"

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy")
    } catch (error) {
      return dateString
    }
  }

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
          <div className="absolute -bottom-16 right-0 md:right-4">
            <Button asChild variant="outline" className="bg-white">
              <Link href="/profile/edit">
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
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

              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center">
                  <Link
                    href={`/profile/${user.id}/connections?tab=followers`}
                    className="flex items-center hover:text-blue-600"
                  >
                    <span className="font-semibold mr-1">{followersCount?.length || 0}</span> Followers
                  </Link>
                </div>
                <div className="flex items-center">
                  <Link
                    href={`/profile/${user.id}/connections?tab=following`}
                    className="flex items-center hover:text-blue-600"
                  >
                    <span className="font-semibold mr-1">{followingCount?.length || 0}</span> Following
                  </Link>
                </div>
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
              { name: "Overview", href: "#overview", active: true },
              { name: "Loans", href: "#loans" },
              { name: "Transactions", href: "#transactions" },
              { name: "Virtual Account", href: "#virtual-account" },
              { name: "Connections", href: `/profile/${user.id}/connections` },
              { name: "Activity", href: "#activity" },
            ].map((tab) => (
              <a
                key={tab.name}
                href={tab.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors inline-block",
                  tab.active
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                )}
              >
                {tab.name}
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="overview">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-6">
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
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information Card */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Personal Information</CardTitle>
                      <Link href="/profile/edit">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{fullName}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Date of Birth</p>
                        <p className="font-medium">
                          {profile.date_of_birth ? formatDate(profile.date_of_birth) : "Not provided"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">BVN</p>
                        <p className="font-medium">{profile.bvn || "Not provided"}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">ID Verification</p>
                        <p className="font-medium">
                          {profile.id_verified ? (
                            <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>
                          ) : (
                            <Badge variant="outline">Not Verified</Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Employment Information Card */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Employment Information</CardTitle>
                      <Link href="/profile/edit?tab=employment">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {profile.employment_status ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Employment Status</p>
                          <p className="font-medium">{profile.employment_status}</p>
                        </div>

                        {profile.job_title && (
                          <div>
                            <p className="text-sm text-gray-500">Job Title</p>
                            <p className="font-medium">{profile.job_title}</p>
                          </div>
                        )}

                        {profile.employer_name && (
                          <div>
                            <p className="text-sm text-gray-500">Employer</p>
                            <p className="font-medium">{profile.employer_name}</p>
                          </div>
                        )}

                        {profile.monthly_income !== null && profile.monthly_income !== undefined && (
                          <div>
                            <p className="text-sm text-gray-500">Monthly Income</p>
                            <p className="font-medium">₦{profile.monthly_income.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500 mb-3">No employment information added yet</p>
                        <Link href="/profile/edit?tab=employment">
                          <Button size="sm">Add Employment Details</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Loan Helper Settings Card */}
                {loanHelperSettings && (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Loan Helper Settings</CardTitle>
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
                          <span className="text-2xl font-bold">
                            ₦{loanHelperSettings.loan_amount?.toLocaleString()}
                          </span>
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
            </div>

            {/* Loans Section */}
            <div className="mt-12 pt-6 border-t border-gray-200" id="loans">
              <h2 className="text-2xl font-bold mb-4">Loan History</h2>
              <Card>
                <CardContent className="py-6">
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-3">No loan history available</p>
                    <Link href="/loans">
                      <Button>View Loans</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions Section */}
            <div className="mt-12 pt-6 border-t border-gray-200" id="transactions">
              <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
              <Card>
                <CardContent className="py-6">
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-3">No transaction history available</p>
                    <Link href="/transactions">
                      <Button>View Transactions</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Virtual Account Section */}
            <div className="mt-12 pt-6 border-t border-gray-200" id="virtual-account">
              <h2 className="text-2xl font-bold mb-4">Virtual Account</h2>
              <Card>
                <CardContent className="py-6">
                  {virtualAccount ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col p-4 border rounded-lg">
                          <span className="text-sm text-muted-foreground">Account Number</span>
                          <span className="text-xl font-semibold">{virtualAccount.account_number}</span>
                        </div>
                        <div className="flex flex-col p-4 border rounded-lg">
                          <span className="text-sm text-muted-foreground">Bank Name</span>
                          <span className="text-xl font-semibold">{virtualAccount.bank_name}</span>
                        </div>
                        <div className="flex flex-col p-4 border rounded-lg">
                          <span className="text-sm text-muted-foreground">Account Name</span>
                          <span className="text-xl font-semibold">{virtualAccount.account_name}</span>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-blue-700">
                          <strong>Note:</strong> You can fund your Peer Capital account by making a transfer to this
                          virtual account. The funds will be credited automatically.
                        </p>
                      </div>

                      <VirtualAccountTransactions userId={user.id} />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium mb-2">No Virtual Account Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Create a virtual account to receive funds directly into your Peer Capital account.
                      </p>
                      <Button asChild>
                        <Link href="/profile/virtual-account">Create Virtual Account</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activity Section */}
            <div className="mt-12 pt-6 border-t border-gray-200" id="activity">
              <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
              <Card>
                <CardContent className="py-6">
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-3">No recent activity</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
