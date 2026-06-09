"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { 
  BarChart3, 
  Users, 
  ClipboardList,
  Globe, 
  Settings, 
  Key, 
  Webhook,
  MessageSquareText,
  Menu,
  ChevronDown,
  LogOut,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: BarChart3 },
  { name: "Case Management", href: "/admin/cases", icon: ClipboardList },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Onramp Requests", href: "/admin/onramp-requests", icon: ArrowUpRight },
  { name: "Offramp Requests", href: "/admin/offramp-requests", icon: ArrowDownRight },
  { name: "IP Allowlist", href: "/admin/ip-allowlist", icon: Globe },
  { name: "Asset Preferences", href: "/admin/asset-preferences", icon: Settings },
  { name: "Fee Configuration", href: "/admin/fees", icon: DollarSign },
  { name: "API Keys", href: "/admin/api-keys", icon: Key },
  { name: "Webhooks", href: "/admin/webhooks", icon: Webhook },
  { name: "Dojah Webhooks", href: "/admin/dojah-webhooks", icon: Webhook },
  { name: "Dojah Sender ID", href: "/admin/dojah-sender-id", icon: MessageSquareText },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/check-auth', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin || false)
        } else {
          router.push('/')
        }
      } catch (error) {
        console.error('Admin check failed:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading Admin Panel...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="flex items-center">
                <Image
                  src="/peer-capital-logo-new.png"
                  alt="Peer Capital"
                  width={80}
                  height={24}
                  className="object-contain"
                  priority
                />
                <div className="ml-2">
                  <div className="text-xs text-slate-500 font-medium">Admin Panel</div>
                </div>
              </Link>
            </div>

            {/* Right side - Navigation Dropdown */}
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Menu className="h-4 w-4" />
                    <span>Admin Menu</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center w-full",
                            isActive ? "bg-blue-50 text-blue-700" : ""
                          )}
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                  <DropdownMenuItem asChild>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-red-600 hover:text-red-700"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}