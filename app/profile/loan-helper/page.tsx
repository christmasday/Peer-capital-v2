"use client"

import { getUserProfile } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { MainLayout } from "@/components/layouts/main-layout"
import { LoanHelperSettingsForm } from "@/components/profile/loan-helper-settings-form"
import { LoanHelperSettingsDisplay } from "@/components/profile/loan-helper-settings-display"
import { checkAuth } from "@/lib/auth-utils"
import { ProfileMenu } from "@/components/profile/profile-menu"
import { useState } from "react"

export const dynamic = "force-dynamic"

export default function LoanHelperSettingsPage() {
  // Check authentication
  // This page is now a client component for toggling edit/view
  // Use a client-side fetch for userProfile if needed, or pass as prop from a parent
  // For now, assume userProfile is available via a prop or context
  // (If not, you can add a fetch here or convert to server component as needed)
  const [editing, setEditing] = useState(false)
  // TODO: Replace with actual user profile fetching logic if needed
  const userProfile = (typeof window !== 'undefined' && (window as any).userProfile) || { user: { id: "" }, profile: { first_name: "User", profile_picture_url: "/vibrant-street-market.png" } }

  return (
    <MainLayout
      userName={userProfile.profile?.username ? `@${userProfile.profile.username}` : userProfile.profile?.first_name || "User"}
      userImage={userProfile.profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Lending goals</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <ProfileMenu />
          </div>

          <div className="md:col-span-3">
            {editing ? (
              <LoanHelperSettingsForm
                userId={userProfile.user.id}
                onSave={() => setEditing(false)}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <>
                <div className="flex justify-end mb-4">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => setEditing(true)}
                  >
                    Edit Settings
                  </button>
                </div>
                <LoanHelperSettingsDisplay userId={userProfile.user.id} />
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
