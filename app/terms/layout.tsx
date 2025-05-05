import type React from "react"
import type { Metadata } from "next"
import { LandingLayout } from "@/components/layouts/landing-layout"

export const metadata: Metadata = {
  title: "Terms of Service | Peer Capital",
  description: "Terms and conditions for using the Peer Capital platform",
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <LandingLayout>{children}</LandingLayout>
}
