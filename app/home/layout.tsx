import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUserId } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

import { MainLayout } from "@/components/layouts/main-layout"

export const metadata: Metadata = {
  title: "Home - Peer Capital",
  description: "Peer Capital home page",
}

export default async function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Try to get the current user ID
  const userId = await getCurrentUserId()

  if (!userId) {
    // No authenticated user found — redirect to login
    redirect("/?from=home-no-auth")
  }

  // Get user profile data
  try {
    const adminClient = createAdminClient()
    const { data: user, error } = await adminClient.from("profiles").select("*").eq("id", userId).single()

    if (error || !user) {
      redirect("/?from=home-profile-error")
    }

    // Get the full name from the user data
    const fullName = user?.username ? `@${user.username}` : user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim()

    return (
      <MainLayout userName={fullName} userImage={user?.profile_picture_url} requireAuth={false}>
        {children}
      </MainLayout>
    )
  } catch (error) {
    redirect("/?from=home-layout-error")
  }
}
