import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUserId } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { MainLayout } from "@/components/layouts/main-layout"

export const metadata: Metadata = {
  title: "Timeline - Peer Capital",
  description: "Your social timeline",
}

export default async function TimelineLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const userId = await getCurrentUserId()
  if (!userId) {
    redirect("/?from=timeline-no-auth")
  }

  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("username, first_name, last_name, profile_picture_url").eq("id", userId).maybeSingle()
  const fullName = profile?.username ? `@${profile.username}` : `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || undefined

  return (
    <MainLayout userName={fullName} userImage={profile?.profile_picture_url} requireAuth={false}>
      {children}
    </MainLayout>
  )
}


