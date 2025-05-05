import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import { LandingLayout } from "@/components/layouts/landing-layout"

export const metadata: Metadata = {
  title: "Privacy Policy | PeerCapital",
  description: "Learn how PeerCapital collects, uses, and protects your personal information.",
}

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LandingLayout>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </LandingLayout>
  )
}
