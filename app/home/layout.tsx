import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Home - Peer Capital",
  description: "Peer Capital home page",
}

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
