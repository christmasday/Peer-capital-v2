"use client"

import {
  Home,
  Wallet,
  User,
  BarChart2,
  LogOut,
  Menu,
  ChevronLeft,
  MessageCircleQuestionIcon as QuestionMarkCircle,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { SignoutButton } from "@/components/auth/signout-button"
import { Logo } from "@/components/logo"

interface DesktopNavProps {
  userName?: string
  userImage?: string
}

export function DesktopNav({ userName, userImage }: DesktopNavProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Check if the screen is small on initial render and when resized
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 1280) {
        setIsCollapsed(true)
      }
    }

    // Check on initial render
    checkScreenSize()

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize)

    // Clean up
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  const navItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/loans", label: "Loans", icon: Wallet },
    { href: "/transactions", label: "Transactions", icon: BarChart2 },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/faq", label: "FAQ", icon: QuestionMarkCircle },
  ]

  return (
    <div
      className={cn(
        "hidden lg:flex flex-col h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-20 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      <div className={cn("p-6 flex justify-between items-center", isCollapsed && "p-4")}>
        {!isCollapsed ? (
          <Logo width={54} height={14} className="flex-shrink-0" />
        ) : (
          <Link href="/home" className="flex items-center justify-center w-full">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              PC
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-auto"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex-1 px-4 py-6">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  isCollapsed && "justify-center px-2",
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className={cn("p-4 border-t border-gray-200", isCollapsed && "flex justify-center")}>
        {!isCollapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="relative h-10 w-10 rounded-full overflow-hidden">
                  <Image
                    src={userImage || "/placeholder.svg?height=100&width=100&query=user"}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{userName || "User"}</p>
                  <p className="text-xs text-gray-500">View profile</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </SignoutButton>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative h-10 w-10 rounded-full overflow-hidden hover:ring-2 hover:ring-gray-200 transition-all">
                <Image
                  src={userImage || "/placeholder.svg?height=100&width=100&query=user"}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </SignoutButton>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
