"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Home, Wallet, BarChart2, MessageCircle, Search, ChevronRight, Lock, Settings as SettingsIcon, List } from "lucide-react"
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
import { Logo } from "@/components/logo"
import Image from "next/image"
import { UserSearchDialog } from "@/components/search/user-search-dialog"
import { getUnreadMessagesCount } from "@/lib/actions/messages"
import { getUnreadNotificationsCount } from "@/lib/actions/notifications"
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown"

interface TopNavProps {
  userName?: string // This should be the full name
  userImage?: string
  hideSearch?: boolean
}

export function TopNav({ userName, userImage, hideSearch }: TopNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const pathname = usePathname()

  // Ensure we have a valid user name to display
  const displayName = userName && userName.trim() !== "" ? userName : "My Account"

  const navItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/loans", label: "Loans", icon: Wallet },
    { href: "/transactions", label: "Transactions", icon: BarChart2 },
  ]

  useEffect(() => {
    // Fetch unread counts on mount and periodically
    const fetchUnreadCounts = async () => {
      try {
        setFetchError(false)

        // Fetch messages count with error handling
        let messagesCount = 0
        try {
          const messagesResult = await getUnreadMessagesCount()
          messagesCount = messagesResult.count || 0
        } catch (error) {
          // Continue with other fetches even if this one fails
        }

        // Fetch notifications count with error handling
        let notificationsCount = 0
        try {
          const notificationsResult = await getUnreadNotificationsCount()
          notificationsCount = notificationsResult.count || 0
        } catch (error) {
        }

        // Update state with whatever data we were able to fetch
        setUnreadMessages(messagesCount)
        setUnreadNotifications(notificationsCount)
      } catch (error) {
        setFetchError(true)
      }
    }

    fetchUnreadCounts()

    // Poll for updates every 30 seconds, but only if the initial fetch was successful
    const interval = setInterval(() => {
      if (!fetchError) {
        fetchUnreadCounts()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchError])

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
          {/* Search */}
          {!hideSearch && (
            <Button variant="ghost" size="icon" className="relative" onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5 text-gray-700" />
            </Button>
          )}

          {/* Messages */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/messages">
              <MessageCircle className="h-5 w-5 text-gray-700" />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </Link>
          </Button>

          {/* Notifications - Using only the NotificationsDropdown component */}
          <NotificationsDropdown
            open={notificationsOpen}
            onOpenChange={setNotificationsOpen}
            onNotificationRead={() => setUnreadNotifications((prev) => Math.max(0, prev - 1))}
          />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="relative h-8 w-8 rounded-full overflow-hidden bg-blue-100">
                  <Image
                    src={userImage || "/vibrant-street-market.png"}
                    alt="Profile"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <Link href="/profile" className="block">
                <DropdownMenuLabel className="cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-blue-100">
                      <Image
                        src={userImage || "/vibrant-street-market.png"}
                        alt="Profile"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                    <div className="flex flex-col">
                      <span>{displayName}</span>
                      <span className="text-xs text-gray-500">View profile</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </Link>
              <DropdownMenuSeparator />
              {/* Settings & Privacy Nested Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center cursor-pointer px-2 py-2 hover:bg-gray-100 rounded">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    <span>Settings & privacy</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="right" className="w-56 ml-2">
                  <Link href="/settings" className="flex items-center px-2 py-2 hover:bg-gray-100 rounded">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    <span>Settings</span>
                  </Link>
                  <Link href="/privacy-center" className="flex items-center px-2 py-2 hover:bg-gray-100 rounded">
                    <Lock className="h-4 w-4 mr-2" />
                    <span>Privacy Center</span>
                  </Link>
                  <Link href="/profile/activity-log" className="flex items-center px-2 py-2 hover:bg-gray-100 rounded">
                    <List className="h-4 w-4 mr-2" />
                    <span>Activity Log</span>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  <Link
                    href="/messages"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      pathname.startsWith("/messages")
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <div className="relative">
                      <MessageCircle className="h-5 w-5" />
                      {unreadMessages > 0 && (
                        <span className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {unreadMessages > 9 ? "9+" : unreadMessages}
                        </span>
                      )}
                    </div>
                    <span>Messages</span>
                  </Link>
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
