import type React from "react"
import type { Metadata } from "next"
import { cookies } from "next/headers"
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
    // Check for auth bypass in cookies
    const cookieStore = cookies()
    const authBypass = cookieStore.get("auth-bypass")?.value
    const authStatus = cookieStore.get("auth-status")?.value
    const isAuthenticated = cookieStore.get("is_authenticated")?.value

    if (authBypass === "true" || authStatus === "authenticated" || isAuthenticated === "true") {
      // User has auth cookies but no user ID, try to get a fallback user
      try {
        const adminClient = createAdminClient()
        const { data: firstUser } = await adminClient.from("profiles").select("id").limit(1).single()

        if (firstUser?.id) {
          // Continue with this user ID
        } else {
          redirect("/?from=home-no-fallback-user")
        }
      } catch (error) {
        redirect("/?from=home-fallback-error")
      }
    } else {
      // No auth cookies and no user ID, redirect to login
      redirect("/?from=home-no-auth")
    }
  }

  // Get user profile data
  try {
    const adminClient = createAdminClient()
    const { data: user, error } = await adminClient.from("profiles").select("*").eq("id", userId).single()

    if (error || !user) {
      redirect("/?from=home-profile-error")
    }

    // Get the full name from the user data
    const fullName = user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim()

    return (
      <MainLayout userName={fullName} userImage={user?.profile_picture_url} requireAuth={false}>
        {children}
      </MainLayout>
    )
  } catch (error) {
    redirect("/?from=home-layout-error")
  }
}
