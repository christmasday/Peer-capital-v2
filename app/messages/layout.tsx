import { getUserProfile } from "@/lib/actions/auth"
import { MainLayout } from "@/components/layouts/main-layout"
import type { ReactNode } from "react"

export default async function MessagesLayout({ children }: { children: ReactNode }) {
  // Fetch the user profile to get the name and image
  const { profile } = await getUserProfile()

  // Construct the user's full name
  const userName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "User"

  // Get the user's image
  const userImage = profile?.profile_picture_url || "/vibrant-street-market.png"

  return (
    <MainLayout userName={userName} userImage={userImage}>
      {children}
    </MainLayout>
  )
}
