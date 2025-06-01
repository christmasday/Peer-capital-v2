import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastContainer } from "@/components/toast-provider"
import { SupabaseProvider } from "@/components/supabase/SupabaseProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Auth Mirror - Peer Capital",
  description: "Mirror of Supabase Auth in Public Schema",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
        <ToastContainer />
      </body>
    </html>
  )
}
