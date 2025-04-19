"use client"

import { Bell, Menu, Home, Wallet, BarChart2, User, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SignoutButton } from "@/components/auth/signout-button"

interface ResponsiveHeaderProps {
  userName?: string
  userImage?: string
}

export function ResponsiveHeader({ userName, userImage }: ResponsiveHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/loans", label: "Loans", icon: Wallet },
    { href: "/transactions", label: "Transactions", icon: BarChart2 },
    { href: "/profile", label: "Profile", icon: User },
  ]

  return (
    <>
      <header className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2 rounded-full hover:bg-gray-100">
                  <Menu className="h-5 w-5 text-gray-700" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px] sm:w-[350px]">
                <div className="p-5 border-b flex items-center justify-between">
                  <Link href="/home" onClick={() => setIsMenuOpen(false)}>
                    <Image
                      src="/peer-capital-logo.svg"
                      alt="Peer Capital"
                      width={120}
                      height={120}
                      className="object-contain h-10 w-auto"
                      priority
                    />
                  </Link>
                </div>

                <div className="p-4 border-b">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src={userImage || "/placeholder.svg?height=100&width=100&query=user"}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{userName || "User"}</p>
                      <Link href="/profile" className="text-sm text-blue-600" onClick={() => setIsMenuOpen(false)}>
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>

                <nav className="p-4">
                  <ul className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                              isActive
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>

                  <div className="mt-6 pt-6 border-t">
                    <SignoutButton
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-3"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      <span>Log out</span>
                    </SignoutButton>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
            <Link href="/home">
              <Image
                src="/peer-capital-logo.svg"
                alt="Peer Capital"
                width={100}
                height={100}
                className="object-contain h-8 w-auto"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 relative">
              <Bell className="h-5 w-5 text-gray-700" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            <Link href="/profile" className="relative h-8 w-8 rounded-full overflow-hidden">
              <Image
                src={userImage || "/placeholder.svg?height=100&width=100&query=user"}
                alt="Profile"
                fill
                className="object-cover"
              />
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}
