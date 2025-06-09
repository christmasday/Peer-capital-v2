import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastContainer } from "@/components/toast-provider"
import { SupabaseProvider } from "@/components/supabase/SupabaseProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Peer Capital",
  description: "Peer Capital is a platform for peer-to-peer lending",
  generator: 'v0.dev',
  icons: {
    icon: '/public/favicon.ico',
  },
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
