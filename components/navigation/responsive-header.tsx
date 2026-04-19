"use client"

import { Bell, Menu, Home, Wallet, BarChart2, User, LogOut, Search, MessageCircleQuestion, Inbox, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { SignoutButton } from "@/components/auth/signout-button"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { UserSearchDialog } from "@/components/search/user-search-dialog"
import { getUnreadNotificationsCount } from "@/lib/actions/notifications"
import { useNotificationRealtime } from "@/hooks/use-notification-realtime"

interface ResponsiveHeaderProps {
  userName?: string
  userImage?: string
}

export function ResponsiveHeader({ userName, userImage }: ResponsiveHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [fetchError, setFetchError] = useState(false)
  const pathname = usePathname()

  const fetchUnreadCounts = async () => {
    try {
      setFetchError(false)
      let notificationsCount = 0
      try {
        const notificationsResult = await getUnreadNotificationsCount()
        notificationsCount = notificationsResult.count || 0
      } catch (error) {}
      setUnreadNotifications(notificationsCount)
    } catch (error) {
      setFetchError(true)
    }
  }

  const { isRealtimeConnected } = useNotificationRealtime(() => {
    if (!fetchError) {
      void fetchUnreadCounts()
    }
  })

  useEffect(() => {
    void fetchUnreadCounts()
  }, [])

  useEffect(() => {
    if (isRealtimeConnected) {
      return
    }

    const interval = setInterval(() => {
      if (!fetchError) fetchUnreadCounts()
    }, 300000)

    return () => clearInterval(interval)
  }, [fetchError, isRealtimeConnected])

  const navItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/loans", label: "Loans", icon: Wallet },
    { href: "/transactions", label: "Transactions", icon: BarChart2 },
    { href: "/messages", label: "Messages", icon: Inbox },
    { href: "/notifications", label: "Notifications", icon: Bell, badge: unreadNotifications },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/faq", label: "FAQ", icon: MessageCircleQuestion },
  ]

  return (
    <>
      {/* Search Dialog */}
      <UserSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

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
                <div className="p-5 border-b relative">
                    <Logo width={54} height={14} className="flex-shrink-0" />
                    <SheetClose asChild>
                      <button
                        aria-label="Close menu"
                        className="absolute right-4 top-4 p-1 rounded-md hover:bg-gray-100"
                      >
                        <X className="h-4 w-4 text-gray-700" />
                      </button>
                    </SheetClose>
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

                <nav className="p-4 space-y-4">
                  {/* Search - Action Item */}
                  <div className="pb-2 border-b">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setSearchOpen(true)
                        setIsMenuOpen(false)
                      }}
                    >
                      <Search className="mr-3 h-5 w-5" />
                      <span>Search</span>
                    </Button>
                  </div>

                  {/* Navigation Items */}
                  <ul className="space-y-1">
                    {navItems.map((item: any) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                              isActive
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <span className="flex items-center gap-3">
                              <Icon className="h-5 w-5" />
                              <span>{item.label}</span>
                            </span>
                            {item.badge && item.badge > 0 && (
                              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-semibold text-white bg-red-500 rounded-full">
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>

                  <div className="border-t border-gray-100 my-4 pt-4">
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
            <Logo width={60} height={15} className="flex-shrink-0" />
          </div>
          {/* Hide the header toolbar icons while the mobile menu is open to avoid duplicates */}
          {!isMenuOpen && (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="p-2 relative" onClick={() => setSearchOpen(true)}>
                <Search className="h-5 w-5 text-gray-700" />
              </Button>
              <button className="p-2 relative">
                <Bell className="h-5 w-5 text-gray-700" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
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
          )}
        </div>
      </header>
    </>
  )
}
