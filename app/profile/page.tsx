import Link from "next/link"
import { getUserProfile } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  CreditCard,
  Shield,
  Briefcase,
  FileText,
  Upload,
  AlertTriangle,
  Wallet,
  CreditCardIcon,
} from "lucide-react"
import { MainLayout } from "@/components/layouts/main-layout"
import { format } from "date-fns"
import { checkAuth } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LoanHelperSettingsDisplay } from "@/components/profile/loan-helper-settings-display"
import { VirtualAccountButton } from "@/components/profile/virtual-account-button"
import { getVirtualAccount } from "@/lib/actions/paystack"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  // Check authentication
  await checkAuth()

  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/")
  }

  const profile = userProfile.profile
  const user = userProfile.user

  // Get virtual account if exists
  const virtualAccountResult = await getVirtualAccount(user.id)
  const virtualAccount = virtualAccountResult.success ? virtualAccountResult.virtualAccount : null

  // Format date function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not provided"
    try {
      return format(new Date(dateString), "MMMM d, yyyy")
    } catch (error) {
      return dateString
    }
  }

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "Not provided"
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Get ID type display name
  const getIdTypeName = (idType: string | null | undefined) => {
    if (!idType) return "Not provided"

    const idTypes: Record<string, string> = {
      drivers_license: "Driver's License",
      national_id: "National ID Card",
      nin_slip: "NIN Slip",
      international_passport: "International Passport",
    }

    return idTypes[idType] || idType
  }

  // Get employment status display name
  const getEmploymentStatusName = (status: string | null | undefined) => {
    if (!status) return "Not provided"

    const statuses: Record<string, string> = {
      employed: "Employed",
      self_employed: "Self-Employed",
      business_owner: "Business Owner",
      unemployed: "Unemployed",
      student: "Student",
      retired: "Retired",
    }

    return statuses[status] || status
  }

  // Function to check if the profile is complete
  const isProfileComplete = () => {
    return (
      profile?.first_name &&
      profile?.last_name &&
      profile?.phone_number &&
      profile?.address &&
      profile?.city &&
      profile?.state &&
      profile?.bvn &&
      profile?.date_of_birth
    )
  }

  const profileComplete = isProfileComplete()

  return (
    <MainLayout
      userName={profile?.first_name || "User"}
      userImage={profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        </div>

        {/* Profile Completion Status */}
        {!profileComplete && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <div>
                  Your profile is incomplete. Please provide all required information to unlock additional features.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="id">ID Verification</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="loan">Loan Helper</TabsTrigger>
            <TabsTrigger value="virtual">Virtual Account</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
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

                  {/* Withdrawal Account Information */}
                  <h3 className="text-lg font-semibold mb-4">Withdrawal Account</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Bank Name</p>
                      <p className="font-medium">{profile?.bank_name || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Number</p>
                      <p className="font-medium">{profile?.account_number || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Name</p>
                      <p className="font-medium">{profile?.account_name || "Not provided"}</p>
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
                        {formatCurrency(userProfile.account?.balance || 0)}
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 mb-1">Loan Balance</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {formatCurrency(userProfile.account?.loan_balance || 0)}
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
          </TabsContent>

          <TabsContent value="id">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    ID Verification
                  </h3>
                  <Badge
                    variant={profile?.id_verified ? "default" : "outline"}
                    className={profile?.id_verified ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                  >
                    {profile?.id_verified ? "Verified" : "Pending Verification"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-start gap-3 mb-4">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">ID Type</p>
                        <p className="font-medium">{getIdTypeName(profile?.id_type)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 mb-4">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">ID Number</p>
                        <p className="font-medium">{profile?.id_number || "Not provided"}</p>
                      </div>
                    </div>

                    {profile?.id_verification_date && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Verification Date</p>
                          <p className="font-medium">{formatDate(profile.id_verification_date)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col items-center justify-center">
                      {profile?.id_document_url ? (
                        <div className="text-center">
                          <div className="bg-blue-50 p-3 rounded-full mb-3 inline-block">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                          <p className="font-medium mb-1">ID Document Uploaded</p>
                          <p className="text-sm text-gray-500 mb-3">
                            Your ID document has been submitted for verification
                          </p>
                          <Link href={profile.id_document_url} target="_blank">
                            <Button variant="outline" size="sm">
                              View Document
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="bg-gray-100 p-3 rounded-full mb-3 inline-block">
                            <Upload className="h-6 w-6 text-gray-500" />
                          </div>
                          <p className="font-medium mb-1">No ID Document</p>
                          <p className="text-sm text-gray-500 mb-3">You haven't uploaded an ID document yet</p>
                          <Link href="/profile/edit?tab=id">
                            <Button variant="outline" size="sm">
                              Upload ID Document
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {!profile?.id_verified && (
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                      <p className="font-medium mb-1">Verification Status:</p>
                      <p>
                        Your ID verification is pending. This process typically takes 1-2 business days after document
                        submission. Once verified, you'll have access to higher loan limits and additional features.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Employment Information
                  </h3>
                  <Badge
                    variant={profile?.employment_verified ? "default" : "outline"}
                    className={profile?.employment_verified ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                  >
                    {profile?.employment_verified ? "Verified" : "Pending Verification"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-start gap-3 mb-4">
                      <Briefcase className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Employment Status</p>
                        <p className="font-medium">{getEmploymentStatusName(profile?.employment_status)}</p>
                      </div>
                    </div>

                    {(profile?.employment_status === "employed" ||
                      profile?.employment_status === "self_employed" ||
                      profile?.employment_status === "business_owner") && (
                      <>
                        <div className="flex items-start gap-3 mb-4">
                          <Briefcase className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              {profile?.employment_status === "business_owner" ? "Business Name" : "Employer Name"}
                            </p>
                            <p className="font-medium">{profile?.employer_name || "Not provided"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 mb-4">
                          <User className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              {profile?.employment_status === "business_owner" ? "Position/Role" : "Job Title"}
                            </p>
                            <p className="font-medium">{profile?.job_title || "Not provided"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 mb-4">
                          <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              {profile?.employment_status === "business_owner"
                                ? "Business Address"
                                : "Employer Address"}
                            </p>
                            <p className="font-medium">{profile?.employer_address || "Not provided"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 mb-4">
                          <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Work Phone</p>
                            <p className="font-medium">{profile?.work_phone || "Not provided"}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <div className="flex items-start gap-3 mb-4">
                      <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Monthly Income</p>
                        <p className="font-medium">{formatCurrency(profile?.monthly_income)}</p>
                      </div>
                    </div>

                    {(profile?.employment_status === "employed" ||
                      profile?.employment_status === "self_employed" ||
                      profile?.employment_status === "business_owner") && (
                      <>
                        <div className="flex items-start gap-3 mb-4">
                          <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Start Date</p>
                            <p className="font-medium">{formatDate(profile?.employment_start_date)}</p>
                          </div>
                        </div>

                        {profile?.employment_end_date && (
                          <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">End Date</p>
                              <p className="font-medium">{formatDate(profile?.employment_end_date)}</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {!profile?.employment_verified && profile?.employment_status && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-medium mb-1">Verification Status:</p>
                    <p>
                      Your employment information is pending verification. This helps us better assess your loan
                      eligibility. We may contact you for additional documentation if needed.
                    </p>
                  </div>
                )}

                {!profile?.employment_status && (
                  <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="font-medium mb-2">No Employment Information</p>
                    <p className="text-sm text-gray-500 mb-3">You haven't added your employment information yet</p>
                    <Link href="/profile/edit?tab=employment">
                      <Button variant="outline" size="sm">
                        Add Employment Details
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loan">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      Helper Settings
                    </h3>
                    <Link href="/profile/loan-helper">
                      <Button size="sm">Edit Settings</Button>
                    </Link>
                  </div>

                  <LoanHelperSettingsDisplay userId={user.id} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="virtual">
            <div className="grid grid-cols-1 gap-6">
              <VirtualAccountButton virtualAccount={virtualAccount} />

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5 text-blue-600" />
                    About Virtual Accounts
                  </h3>

                  <div className="space-y-4">
                    <p>
                      A virtual account is a dedicated bank account assigned to you for easy deposits into your Peer
                      Capital wallet. Here's how it works:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Instant Funding</h4>
                        <p className="text-sm text-gray-700">
                          Transfers to your virtual account are automatically credited to your wallet within minutes.
                        </p>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Dedicated Account</h4>
                        <p className="text-sm text-gray-700">
                          Your virtual account is uniquely yours and remains the same for all future transactions.
                        </p>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">No Transfer Fees</h4>
                        <p className="text-sm text-gray-700">
                          Fund your account without paying any additional transfer fees or charges.
                        </p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                      <p className="font-medium mb-1">Important Note:</p>
                      <p>
                        Your virtual account can only be used for deposits. For withdrawals, please use the withdrawal
                        feature and provide your regular bank account details.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
