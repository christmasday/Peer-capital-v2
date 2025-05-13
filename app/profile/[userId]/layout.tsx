import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { MainLayout } from "@/components/layouts/main-layout"
import type { ReactNode } from "react"

export default async function UserProfileLayout({ children }: { children: ReactNode }) {
  // Get user information for the TopNav
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Get current user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get user profile if user is logged in
  let userName = undefined
  let userImage = undefined

  if (session?.user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, profile_picture_url")
      .eq("id", session.user.id)
      .single()

    if (profile) {
      userName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
      userImage = profile.profile_picture_url
    }
  }

  return (
    <MainLayout userName={userName} userImage={userImage} className="p-0">
      {children}
    </MainLayout>
  )
}
