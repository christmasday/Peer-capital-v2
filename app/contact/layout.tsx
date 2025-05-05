import type React from "react"
import { Suspense } from "react"
import { LandingLayout } from "@/components/layouts/landing-layout"

export const metadata = {
  title: "Contact Us - Peer Capital",
  description: "Get in touch with our team for any questions or inquiries",
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingLayout>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </LandingLayout>
  )
}
