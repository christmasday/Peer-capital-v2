import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SupabaseStorageInitializer } from "@/components/supabase-storage-initializer"
import { ToastContainer } from "@/components/toast-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Peer Capital",
  description: "Peer-to-peer lending platform",
  generator: "v0.dev",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SupabaseStorageInitializer />
          <ToastContainer />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

import "./globals.css"
