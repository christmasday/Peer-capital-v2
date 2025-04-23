import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Account - Peer Capital",
  description: "Manage your Peer Capital account",
}

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
