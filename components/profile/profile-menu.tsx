"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Bell, Shield, CreditCard, Lock, Wallet, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function ProfileMenu() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

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
    {
      label: "Loan Helper Settings",
      href: "/profile/loan-helper",
      icon: <Wallet className="h-4 w-4 mr-2" />,
    },
  ]

  return (
    <Card className="w-full">
      <div className="md:hidden p-3 border-b">
        <Button
          variant="ghost"
          className="w-full flex justify-between items-center"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <span className="font-medium">Menu</span>
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>
      <CardContent
        className={cn(
          "transition-all duration-200 ease-in-out",
          "p-3 md:p-4",
          isCollapsed ? "max-h-0 overflow-hidden p-0 md:max-h-[1000px] md:p-4" : "max-h-[1000px]",
        )}
      >
        <div className="flex flex-col">
          {menuItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-sm md:text-base py-2 px-3 md:py-2 md:px-4",
                "transition-colors duration-200",
                pathname === item.href ? "bg-blue-600" : "",
                "hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-300",
                pathname === item.href ? "hover:bg-blue-700 hover:text-white dark:hover:bg-blue-800" : "",
              )}
              asChild
            >
              <Link href={item.href} className="flex items-center w-full">
                <span className="flex items-center justify-center">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
