import { getUserProfile } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Edit, Mail, Phone, MapPin, Calendar, User, CreditCard, Shield } from "lucide-react"
import { SeedDataButton } from "@/components/admin/seed-data-button"
import { MainLayout } from "@/components/layouts/main-layout"
import { format } from "date-fns"
import { SignoutButton } from "@/components/auth/signout-button"
import { checkAuth } from "@/lib/auth-utils"

export default async function ProfilePage() {
  // Check authentication
  await checkAuth()

  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  const profile = userProfile.profile
  const user = userProfile.user

  // Format date function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not provided"
    try {
      return format(new Date(dateString), "MMMM d, yyyy")
    } catch (error) {
      return dateString
    }
  }

  return (
    <MainLayout
      userName={profile?.first_name || "User"}
      userImage={profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <div className="flex gap-2">
            <SeedDataButton userId={userProfile.user.id} />
            <Link href="/profile/edit">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-col items-center pb-4">
              <div className="relative h-32 w-32 rounded-full overflow-hidden mb-4 border-4 border-white shadow-md">
                <Image
                  src={profile?.profile_picture_url || "/placeholder.svg?height=200&width=200&query=user"}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-center">
                {profile?.first_name} {profile?.middle_name ? profile.middle_name + " " : ""}
                {profile?.last_name}
              </h2>
              <p className="text-gray-500 flex items-center gap-1 mt-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
              <div className="w-full mt-6">
                <Link href="/profile/edit" className="w-full">
                  <Button variant="outline" className="w-full">
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Details Card */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <User className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="font-medium">
                        {profile?.first_name} {profile?.middle_name || ""} {profile?.last_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mb-4">
                    <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email Address</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mb-4">
                    <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone Number</p>
                      <p className="font-medium">{profile?.phone_number || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                      <p className="font-medium">{formatDate(profile?.date_of_birth)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">BVN</p>
                      <p className="font-medium">{profile?.bvn || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="font-medium">
                        {profile?.address || "Not provided"}
                        {profile?.city ? `, ${profile.city}` : ""}
                        {profile?.state ? `, ${profile.state}` : ""}
                        {profile?.zip_code ? ` ${profile.zip_code}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Created</p>
                      <p className="font-medium">{formatDate(user.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <SignoutButton variant="destructive" className="w-full">
                    Sign Out
                  </SignoutButton>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Change Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics Card */}
          <Card className="lg:col-span-3">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Account Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 mb-1">Account Balance</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(userProfile.account?.balance || 0)}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 mb-1">Loan Balance</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(userProfile.account?.loan_balance || 0)}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 mb-1">Active Loans</p>
                  <p className="text-2xl font-bold text-blue-700">0</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 mb-1">Completed Loans</p>
                  <p className="text-2xl font-bold text-blue-700">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
