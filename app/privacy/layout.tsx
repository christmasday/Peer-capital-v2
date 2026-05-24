import { getUserProfile } from "@/lib/actions/auth"
import { MainLayout } from "@/components/layouts/main-layout"
import type { ReactNode } from "react"

export default async function PrivacyLayout({ children }: { children: ReactNode }) {
  const { profile } = await getUserProfile()
  const userName = profile ? (profile.username ? `@${profile.username}` : `${profile.first_name || ""} ${profile.last_name || ""}`.trim()) : "User"
  const userImage = profile?.profile_picture_url || "/vibrant-street-market.png"

  return (
    <MainLayout userName={userName} userImage={userImage}>
      {children}
    </MainLayout>
  )
}
