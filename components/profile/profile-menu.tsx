"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Bell, Shield, CreditCard, LogOut, Lock } from "lucide-react"
import { SignoutButton } from "@/components/auth/signout-button"

export function ProfileMenu() {
  const pathname = usePathname()

  const menuItems = [
    {
      label: "Personal Information",
      href: "/profile/edit",
      icon: <User className="h-4 w-4 mr-2" />,
    },
    {
      label: "Change Password",
      href: "/profile/change-password",
      icon: <Lock className="h-4 w-4 mr-2" />,
    },
    {
      label: "Notification Settings",
      href: "/profile/notifications",
      icon: <Bell className="h-4 w-4 mr-2" />,
    },
    {
      label: "Security Settings",
      href: "/profile/security",
      icon: <Shield className="h-4 w-4 mr-2" />,
    },
    {
      label: "Payment Methods",
      href: "/profile/payment",
      icon: <CreditCard className="h-4 w-4 mr-2" />,
    },
  ]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "default" : "ghost"}
              className={`w-full justify-start ${pathname === item.href ? "bg-blue-600" : ""}`}
              asChild
            >
              <Link href={item.href}>
                {item.icon}
                {item.label}
              </Link>
            </Button>
          ))}

          <SignoutButton variant="ghost" className="w-full justify-start mt-4">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </SignoutButton>
        </div>
      </CardContent>
    </Card>
  )
}
