"use client"

import type React from "react"

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
