import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { BannerGallery } from "@/components/profile/banner-gallery"
import { checkAuth } from "@/lib/auth-utils"
import { MainLayout } from "@/components/layouts/main-layout"

export const dynamic = "force-dynamic"

export default async function BannerGalleryPage() {
  // Check authentication
  await checkAuth()

  const cookieStore = cookies()
  const supabase = await createServerClient(cookieStore)

  // Get current user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  if (!profile) {
    redirect("/profile")
  }

  // Extract current banner ID if it exists
  let currentBannerId = null
  if (profile.banner_image_url) {
    // Extract the ID from the URL if it's one of our predefined banners
    const bannerUrlParts = profile.banner_image_url.split("/")
    const bannerFilename = bannerUrlParts[bannerUrlParts.length - 1]
    if (bannerFilename.includes(".")) {
      currentBannerId = bannerFilename.split(".")[0]
    }
  }

  // Get user's full name for the layout
  const fullName = profile.username ? `@${profile.username}` : [profile.first_name, profile.last_name].filter(Boolean).join(" ")

  return (
    <MainLayout userName={fullName} userImage={profile.profile_picture_url}>
      <div className="container max-w-4xl py-8">
        <div className="mb-6">
          <Link href="/profile" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Choose a Banner Image</CardTitle>
            <CardDescription>Select a banner image for your profile from our gallery of options.</CardDescription>
          </CardHeader>
          <CardContent>
            <BannerGallery currentBannerId={currentBannerId} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
