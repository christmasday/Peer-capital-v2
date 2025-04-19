"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Bell, Menu, X, Home, Wallet, BarChart2, User, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignoutButton } from "@/components/auth/signout-button"

interface TopNavProps {
  userName?: string
  userImage?: string
}

export function TopNav({ userName, userImage }: TopNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/loans", label: "Loans", icon: Wallet },
    { href: "/transactions", label: "Transactions", icon: BarChart2 },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/home" className="flex items-center gap-2">
            <div className="relative w-[307px] h-[82px]">
              <Image src="/peer-capital-logo.svg" alt="Peer Capital" fill className="object-contain" priority />
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  isActive ? "text-blue-600" : "text-gray-600"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Side - Notifications & Profile */}
        <div className="flex items-center gap-4">
          {/* Messages */}
          <Button variant="ghost" size="icon" className="relative">
            <MessageSquare className="h-5 w-5 text-gray-700" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-700" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="relative h-8 w-8 rounded-full overflow-hidden bg-blue-100">
                  <Image src="/vibrant-street-market.png" alt="Profile" fill className="object-cover" priority />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{userName || "User"}</span>
                  <span className="text-xs text-gray-500">View profile</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/profile/edit">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Edit Profile</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <SignoutButton
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
              />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between py-4 border-b">
                  <div className="font-semibold">Menu</div>
                  <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex flex-col gap-1 py-4">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
                <div className="mt-auto border-t py-4">
                  <div className="mt-6 pt-6 border-t">
                    <SignoutButton
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-3"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Log out
                    </SignoutButton>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
