"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { User, FileText, Key, Bell, Wallet, CreditCard, Users } from "lucide-react"

interface ProfileMenuProps {
  userId?: string
}

export function ProfileMenu({ userId }: ProfileMenuProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      name: "Profile",
      href: userId ? `/profile/${userId}` : "/profile",
      active: pathname === `/profile/${userId}` || pathname === "/profile",
      icon: <User className="h-4 w-4" />,
    },
    {
      name: "Edit Profile",
      href: "/profile",
      active: pathname === `/profile/${userId}` || pathname === "/profile",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      name: "Change Password",
      href: "/profile/change-password",
      active: pathname === "/profile/change-password",
      icon: <Key className="h-4 w-4" />,
    },
    {
      name: "Notifications",
      href: "/profile/notifications",
      active: pathname === "/profile/notifications",
      icon: <Bell className="h-4 w-4" />,
    },
    {
      name: "Lending Goals",
      href: "/profile/loan-helper",
      active: pathname === "/profile/loan-helper",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      name: "Virtual Account",
      href: "/profile/virtual-account",
      active: pathname === "/profile/virtual-account",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      name: "Connections",
      href: userId ? `/profile/${userId}/connections` : "/profile/connections",
      active: pathname === `/profile/${userId}/connections` || pathname === "/profile/connections",
      icon: <Users className="h-4 w-4" />,
    },
  ]

  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex min-w-max space-x-1 border-b">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5",
              item.active ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
