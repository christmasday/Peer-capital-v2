import type React from "react"
import { Suspense } from "react"
import { MainLayout } from "@/components/layouts/main-layout"

export const metadata = {
  title: "Support Inbox - Peer Capital",
  description: "View and manage your support tickets",
}

export default function SupportInboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </MainLayout>
  )
}
