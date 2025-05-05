"use client"

import type React from "react"
import { LandingNav } from "@/components/landing/landing-nav"
import { LandingFooter } from "@/components/landing/landing-footer"

interface LandingLayoutProps {
  children: React.ReactNode
}

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingNav />
      <main className="flex-1 bg-gray-50">{children}</main>
      <LandingFooter />
    </div>
  )
}
