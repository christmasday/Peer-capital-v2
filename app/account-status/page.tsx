import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, User, Mail, Phone, MapPin, CreditCard, Shield, Building } from "lucide-react"
import { MainLayout } from "@/components/layouts/main-layout"
import { checkAuth } from "@/lib/auth-utils"
import { getUserProfile } from "@/lib/actions/auth"
import Link from "next/link"

export default async function AccountStatusPage() {
  // Check authentication
  await checkAuth()

  const userProfile = await getUserProfile()
  if (!userProfile) {
    redirect("/")
  }

  const profile = userProfile.profile
  const user = userProfile.user

  const cookieStore = cookies()
  const supabase = await createServerClient()
  const adminClient = createAdminClient()

  // Get virtual account details
  const { data: virtualAccount } = await adminClient
    .from("virtual_accounts")
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
  const fullName = profile.username ? `@${profile.username}` : `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User"

  // Define verification requirements
  const verificationRequirements = [
    {
      id: "basic_info",
      title: "Basic Information",
      description: "Personal details and contact information",
      icon: User,
      items: [
        {
          field: "first_name",
          label: "First Name",
          value: profile.first_name,
          required: true
        },
        {
          field: "last_name", 
          label: "Last Name",
          value: profile.last_name,
          required: true
        },
        {
          field: "email",
          label: "Email Address",
          value: profile.email,
          required: true
        },
        {
          field: "phone_number",
          label: "Phone Number",
          value: profile.phone_number,
          required: true
        }
      ]
    },
    {
      id: "location",
      title: "Location Information",
      description: "Address and location details",
      icon: MapPin,
      items: [
        {
          field: "address",
          label: "Address",
          value: profile.address,
          required: false
        },
        {
          field: "city",
          label: "City",
          value: profile.city,
          required: false
        },
        {
          field: "state",
          label: "State",
          value: profile.state,
          required: false
        }
      ]
    },
    {
      id: "identity",
      title: "Identity Verification",
      description: "Government-issued identification",
      icon: Shield,
      items: [
        {
          field: "bvn",
          label: "BVN (Bank Verification Number)",
          value: profile.bvn,
          required: true
        },
        {
          field: "id_document_url",
          label: "ID Document",
          value: profile.id_document_url,
          required: false
        }
      ]
    },
    {
      id: "employment",
      title: "Employment Information",
      description: "Work and income details",
      icon: Building,
      items: [
        {
          field: "job_title",
          label: "Job Title",
          value: profile.job_title,
          required: false
        },
        {
          field: "employer_name",
          label: "Employer Name",
          value: profile.employer_name,
          required: false
        },
        {
          field: "monthly_income",
          label: "Monthly Income",
          value: profile.monthly_income,
          required: false
        }
      ]
    },
    {
      id: "financial",
      title: "Financial Information",
      description: "Banking and financial details",
      icon: CreditCard,
      items: [
        {
          field: "virtual_account",
          label: "Virtual Account",
          value: virtualAccount ? "Active" : null,
          required: false
        },
        {
          field: "lending_license_url",
          label: "Lending License",
          value: profile.lending_license_url,
          required: false
        }
      ]
    }
  ]

  // Calculate overall verification status
  const calculateVerificationStatus = () => {
    let completed = 0
    let total = 0

    verificationRequirements.forEach(category => {
      category.items.forEach(item => {
        if (item.required) {
          total++
          if (item.value && item.value.toString().trim() !== "") {
            completed++
          }
        }
      })
    })

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    const isVerified = percentage >= 80 // Consider verified if 80% or more required fields are completed

    return {
      completed,
      total,
      percentage,
      isVerified
    }
  }

  const verificationStatus = calculateVerificationStatus()

  return (
    <MainLayout userName={fullName} userImage={profile.profile_picture_url}>
      <div className="container max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Status</h1>
          <p className="text-gray-600">Check your account verification status and complete missing information</p>
        </div>

        {/* Overall Status Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge 
                  variant={verificationStatus.isVerified ? "default" : "secondary"}
                  className={verificationStatus.isVerified ? "bg-green-500 hover:bg-green-600" : "bg-yellow-500 hover:bg-yellow-600"}
                >
                  {verificationStatus.isVerified ? "Verified" : "Partially Verified"}
                </Badge>
                <span className="text-sm text-gray-600">
                  {verificationStatus.completed} of {verificationStatus.total} required fields completed
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{verificationStatus.percentage}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  verificationStatus.isVerified ? "bg-green-500" : "bg-yellow-500"
                }`}
                style={{ width: `${verificationStatus.percentage}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Categories */}
        <div className="space-y-6">
          {verificationRequirements.map((category) => {
            const Icon = category.icon
            const categoryCompleted = category.items.filter(item => 
              item.required && item.value && item.value.toString().trim() !== ""
            ).length
            const categoryTotal = category.items.filter(item => item.required).length
            const categoryPercentage = categoryTotal > 0 ? Math.round((categoryCompleted / categoryTotal) * 100) : 100

            return (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {category.title}
                    </div>
                    <Badge 
                      variant={categoryPercentage === 100 ? "default" : "secondary"}
                      className={categoryPercentage === 100 ? "bg-green-500 hover:bg-green-600" : "bg-yellow-500 hover:bg-yellow-600"}
                    >
                      {categoryPercentage}%
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.items.map((item) => {
                      const isCompleted = item.value && item.value.toString().trim() !== ""
                      const displayValue = item.value ? item.value.toString() : "Not provided"
                      
                      return (
                        <div key={item.field} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : item.required ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-yellow-500" />
                            )}
                            <div>
                              <div className="font-medium">{item.label}</div>
                              <div className="text-sm text-gray-600">
                                {isCompleted ? displayValue : item.required ? "Required" : "Optional"}
                              </div>
                            </div>
                          </div>
                          {!isCompleted && item.required && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href="/profile">Complete</Link>
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button asChild>
            <Link href="/profile">Complete Profile</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/faq">Help Center</Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
