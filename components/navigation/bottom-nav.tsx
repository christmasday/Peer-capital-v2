"use client"

import { Home, Wallet, User, BarChart2, HelpCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-700 text-white py-3">
      <div className="max-w-md mx-auto flex justify-around">
        <Link href="/home" className="flex flex-col items-center">
          <Home className={`h-6 w-6 ${pathname === "/home" ? "text-white" : "text-blue-300"}`} />
          <span className={`text-xs mt-1 ${pathname === "/home" ? "text-white" : "text-blue-300"}`}>Home</span>
        </Link>
        <Link href="/loans" className="flex flex-col items-center">
          <Wallet className={`h-6 w-6 ${pathname.startsWith("/loans") ? "text-white" : "text-blue-300"}`} />
          <span className={`text-xs mt-1 ${pathname.startsWith("/loans") ? "text-white" : "text-blue-300"}`}>
            Loans
          </span>
        </Link>
        <Link href="/transactions" className="flex flex-col items-center">
          <BarChart2 className={`h-6 w-6 ${pathname === "/transactions" ? "text-white" : "text-blue-300"}`} />
          <span className={`text-xs mt-1 ${pathname === "/transactions" ? "text-white" : "text-blue-300"}`}>
            Transactions
          </span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center">
          <User className={`h-6 w-6 ${pathname.startsWith("/profile") ? "text-white" : "text-blue-300"}`} />
          <span className={`text-xs mt-1 ${pathname.startsWith("/profile") ? "text-white" : "text-blue-300"}`}>
            Profile
          </span>
        </Link>
        <Link href="/faq" className="flex flex-col items-center">
          <HelpCircle className={`h-6 w-6 ${pathname === "/faq" ? "text-white" : "text-blue-300"}`} />
          <span className={`text-xs mt-1 ${pathname === "/faq" ? "text-white" : "text-blue-300"}`}>FAQ</span>
        </Link>
      </div>
    </div>
  )
}
