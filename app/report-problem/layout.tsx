import type React from "react"
import { Suspense } from "react"
import { MainLayout } from "@/components/layouts/main-layout"

export const metadata = {
  title: "Report a Problem - Peer Capital",
  description: "Report issues and get help from our support team",
}

export default function ReportProblemLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </MainLayout>
  )
}
