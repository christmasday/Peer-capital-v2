import type React from "react"
import { LandingLayout } from "@/components/layouts/landing-layout"

export default function CookiePolicyLayout({ children }: { children: React.ReactNode }) {
  return <LandingLayout>{children}</LandingLayout>
}
