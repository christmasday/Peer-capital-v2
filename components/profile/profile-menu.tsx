"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface ProfileMenuProps {
  userId: string
}

export function ProfileMenu({ userId }: ProfileMenuProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      name: "Profile",
      href: `/profile/${userId}`,
      active: pathname === `/profile/${userId}`,
    },
    {
      name: "Edit Profile",
      href: "/profile/edit",
      active: pathname === "/profile/edit",
    },
    {
      name: "Change Password",
      href: "/profile/change-password",
      active: pathname === "/profile/change-password",
    },
    {
      name: "Notifications",
      href: "/profile/notifications",
      active: pathname === "/profile/notifications",
    },
    {
      name: "Loan Helper Settings",
      href: "/profile/loan-helper",
      active: pathname === "/profile/loan-helper",
    },
    {
      name: "Virtual Account",
      href: "/profile/virtual-account",
      active: pathname === "/profile/virtual-account",
    },
    {
      name: "Connections",
      href: `/profile/${userId}/connections`,
      active: pathname === `/profile/${userId}/connections`,
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
              "px-4 py-2 text-sm font-medium transition-colors",
              item.active ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
