import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard - Peer Capital",
  description: "Peer Capital dashboard",
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
