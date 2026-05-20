"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Menu, X, Home, Wallet, BarChart2, Search, Settings, Shield, Activity, HelpCircle, AlertCircle, Mail, Flag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { SignoutButton } from "@/components/auth/signout-button"
import { Logo } from "@/components/logo"
import Image from "next/image"
import { UserSearchDialog } from "@/components/search/user-search-dialog"
import { getUnreadNotificationsCount } from "@/lib/actions/notifications"
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown"
import { useNotificationRealtime } from "@/hooks/use-notification-realtime"

interface TopNavProps {
  userName?: string // This should be the full name
  userImage?: string
  hideSearch?: boolean
}

export function TopNav({ userName, userImage, hideSearch }: TopNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [localUserName, setLocalUserName] = useState(userName || "")
  const [localUserImage, setLocalUserImage] = useState(userImage || "")
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()

  // Fetch user data if not provided via props
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userName || !userImage) {
        try {
          const response = await fetch("/api/auth/get-user-profile")
          if (response.ok) {
            const data = await response.json()
            if (data.profile) {
              const fullName = `${data.profile.first_name || ""} ${data.profile.last_name || ""}`.trim() || data.user.email || "User"
              setLocalUserName(fullName)
              setLocalUserImage(data.profile.profile_picture_url || "")
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      }
    }

    fetchUserData()
  }, [userName, userImage])

  useEffect(() => {
    const fetchAdminStatus = async () => {
      try {
        const response = await fetch("/api/admin/check-auth", {
          credentials: "include",
        })

        if (!response.ok) {
          setIsAdmin(false)
          return
        }

        const data = await response.json()
        setIsAdmin(Boolean(data?.isAdmin))
      } catch (error) {
        setIsAdmin(false)
      }
    }

    fetchAdminStatus()
  }, [])

  // Ensure we have a valid user name to display
  const displayName = (userName || localUserName) && (userName || localUserName).trim() !== "" ? (userName || localUserName) : "My Account"
  const displayImage = userImage || localUserImage

  const navItems = [
    // Home link removed per request
  ]

  // Mobile navigation items (rendered inside the sheet)
  const mobileNavItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/loans", label: "Loans", icon: Wallet },
    { href: "/transactions", label: "Transactions", icon: BarChart2 },
    { href: "/notifications", label: "Notifications", icon: AlertCircle, badge: unreadNotifications },
    { href: "/profile", label: "Profile", icon: Settings },
    { href: "/faq", label: "FAQ", icon: HelpCircle },
  ]

  

  const fetchUnreadNotificationState = useCallback(async () => {
    try {
      const notificationsResult = await getUnreadNotificationsCount()
      setUnreadNotifications(notificationsResult.count || 0)
    } catch (error) {
      // Keep current values if refresh fails.
    }
  }, [])

  const fetchUnreadCounts = useCallback(async () => {
    try {
      setFetchError(false)
      await fetchUnreadNotificationState()
    } catch (error) {
      setFetchError(true)
    }
  }, [fetchUnreadNotificationState])

  useEffect(() => {
    void fetchUnreadCounts()
  }, [fetchUnreadCounts])

  const { isRealtimeConnected: isNotificationsRealtimeConnected } = useNotificationRealtime(() => {
    if (!fetchError) {
      void fetchUnreadNotificationState()
    }
  })

  useEffect(() => {
    if (isNotificationsRealtimeConnected) {
      return
    }

    // Poll only as fallback when realtime is disconnected.
    const interval = setInterval(() => {
      if (!fetchError) {
        void fetchUnreadCounts()
      }
    }, 300000)

    return () => clearInterval(interval)
  }, [fetchError, fetchUnreadCounts, isNotificationsRealtimeConnected])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      {/* Search Dialog */}
      <UserSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Logo width={72} height={18} className="flex-shrink-0" />
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
          {/* Hide header icons while mobile menu is open to clear space */}
          {!isMenuOpen && (
            <>
              {/* Search */}
              {!hideSearch && (
                <div className="relative">
                  <div className="hidden md:flex items-center">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="w-64 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setSearchOpen(true)
                          }
                        }}
                      />
                      <Search className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="md:hidden relative" onClick={() => setSearchOpen(true)}>
                    <Search className="h-5 w-5 text-gray-700" />
                  </Button>
                </div>
              )}

              {/* Timeline Link */}
              <Link href="/timeline" className="hidden md:block">
                <Button variant="ghost" size="icon" className={`relative group transition-all ${pathname.startsWith("/timeline") ? "text-blue-700" : ""}`}>
                  <Activity className="h-5 w-5 text-gray-700 transition-all duration-300 group-hover:fill-blue-500 group-hover:text-blue-500" />
                </Button>
              </Link>

              {/* messaging removed */}

              {/* Notifications - Using only the NotificationsDropdown component */}
              <div className="relative">
                <NotificationsDropdown
                  open={notificationsOpen}
                  onOpenChange={setNotificationsOpen}
                  onNotificationRead={() => setUnreadNotifications((prev) => Math.max(0, prev - 1))}
                />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center z-10">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </div>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-blue-100">
                      <Image
                        src={displayImage || "/vibrant-street-market.png"}
                        alt="Profile"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <Link href="/profile" className="block">
                    <DropdownMenuLabel className="cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center gap-3">

                        <div className="relative h-8 w-8 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
                          <Image src={displayImage || "/vibrant-street-market.png"} alt="Profile" fill className="object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{displayName}</span>

                          <span className="text-xs text-gray-500">View profile</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </Link>
                  <DropdownMenuSeparator />

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Settings className="h-4 w-4 mr-2" />
                      <span>Settings & privacy</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <Link href="/settings">
                        <DropdownMenuItem className="cursor-pointer">
                          <Settings className="h-4 w-4 mr-2" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/privacy">
                        <DropdownMenuItem className="cursor-pointer">
                          <Shield className="h-4 w-4 mr-2" />
                          <span>Privacy Center</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/profile/activity-log">
                        <DropdownMenuItem className="cursor-pointer">
                          <Activity className="h-4 w-4 mr-2" />
                          <span>Activity Log</span>
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <Link href="/admin/dashboard">
                        <DropdownMenuItem className="cursor-pointer">
                          <Shield className="h-4 w-4 mr-2" />
                          <span>Admin</span>
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <HelpCircle className="h-4 w-4 mr-2" />
                      <span>Help & Support</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <Link href="/faq">
                        <DropdownMenuItem className="cursor-pointer">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          <span>Help Center</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/account-status">
                        <DropdownMenuItem className="cursor-pointer">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span>Account Status</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/support-inbox">
                        <DropdownMenuItem className="cursor-pointer">
                          <Mail className="h-4 w-4 mr-2" />
                          <span>Support Inbox</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/report-problem">
                        <DropdownMenuItem className="cursor-pointer">
                          <Flag className="h-4 w-4 mr-2" />
                          <span>Report a Problem</span>
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator />
                  <SignoutButton
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Mobile Menu Button (always present so users can open the menu) */}
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
                  {mobileNavItems.map((item) => {
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
                        <div className="relative flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span>{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-semibold text-white bg-red-500 rounded-full ml-auto">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}

                  {/* Keep Timeline available as a distinct item */}
                  <Link
                    href="/timeline"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      pathname.startsWith("/timeline")
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Activity className="h-5 w-5" />
                    <span>Timeline</span>
                  </Link>
                </nav>
                <div className="mt-auto border-t pt-4">
                  <SignoutButton
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log out
                  </SignoutButton>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
