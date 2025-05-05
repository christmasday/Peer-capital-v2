import type React from "react"
import { Suspense } from "react"
import { LandingLayout } from "@/components/layouts/landing-layout"

export const metadata = {
  title: "FAQ - Peer Capital",
  description: "Frequently asked questions about Peer Capital services",
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingLayout>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </LandingLayout>
  )
}
