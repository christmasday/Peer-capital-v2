"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card } from "@/components/ui/card"

export function TestNav() {
  const pathname = usePathname()

  const testPages = [
    { path: "/test", label: "Test Home" },
    { path: "/test/signin", label: "Sign In Test" },
    { path: "/test/logout", label: "Logout Test" },
    { path: "/test/middleware", label: "Middleware Test" },
  ]

  return (
    <Card className="p-2 mb-6">
      <nav className="flex flex-wrap gap-2">
        {testPages.map((page) => (
          <Link
            key={page.path}
            href={page.path}
            className={`px-3 py-1 rounded text-sm ${
              pathname === page.path ? "bg-blue-100 text-blue-800 font-medium" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {page.label}
          </Link>
        ))}
      </nav>
    </Card>
  )
}
