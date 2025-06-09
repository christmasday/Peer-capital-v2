import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { BannerUploadForm } from "@/components/profile/banner-upload-form"
import { checkAuth } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"

export default async function EditBannerPage() {
  // Ensure authentication is properly maintained
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Add fallback authentication check using JWT
  if (!session) {
    const jwt = cookies().get("jwt-token")?.value
    // If no valid authentication is found, handle gracefully without redirecting
    if (!jwt) {
      // We'll continue rendering the page and let the client-side auth in MainLayout handle redirects if needed
    }
  }

  // Check authentication
  await checkAuth()

  const cookieStore = cookies()
  // const supabase = createServerClient(cookieStore) // moved up

  // Get current user session
  // const {
  //   data: { session },
  // } = await supabase.auth.getSession() // moved up

  if (!session) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  if (!profile) {
    redirect("/profile")
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Link href="/profile" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile Banner</CardTitle>
          <CardDescription>
            Upload a new banner image for your profile. The recommended size is 1500x500 pixels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current Banner Preview */}
          {profile.banner_image_url && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Current Banner</p>
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={profile.banner_image_url || "/placeholder.svg"}
                  alt="Current Banner"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <BannerUploadForm userId={session.user.id} currentBannerUrl={profile.banner_image_url} />
        </CardContent>
      </Card>
    </div>
  )
}
