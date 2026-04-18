"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Plus, ArrowLeftRight, TrendingUp, Wallet } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface VirtualAccount {
  account_number: string
  account_name: string
  bank_name: string
  currency: string
  assigned: boolean
}

interface AccountBalance {
  balance: number
  loan_balance: number
}

export function DashboardOverview() {
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null)
  const [accountBalance, setAccountBalance] = useState<AccountBalance | null>(null)
  const [userName, setUserName] = useState<string>("User")
  const [loading, setLoading] = useState(true)
  const [showBalance, setShowBalance] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Only fetch data if we're in the browser (not during SSR)
    if (typeof window !== 'undefined') {
      fetchDashboardData()
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching dashboard data...")
      
      // Check if we're authenticated by trying to get user profile first
      const profileRes = await fetch("/api/auth/get-user-profile")
      console.log("📱 Profile response status:", profileRes.status)
      
      if (!profileRes.ok) {
        console.log("❌ User not authenticated, skipping data fetch")
        setLoading(false)
        return
      }
      
      const profileData = await profileRes.json()
      console.log("📱 Profile data:", profileData)
      if (profileData.profile) {
        const fullName = `${profileData.profile.first_name || ""} ${profileData.profile.last_name || ""}`.trim() || profileData.user.email || "User"
        setUserName(fullName)
      }
      
      // Fetch virtual account from database via Stablesrail
      console.log("🏦 Fetching virtual account from database...")
      const virtualAccountRes = await fetch("/api/stablesrail/virtual-account", {
        credentials: 'include'
      })
      console.log("🏦 Virtual account response status:", virtualAccountRes.status)
      if (virtualAccountRes.ok) {
        const virtualAccountData = await virtualAccountRes.json()
        console.log("🏦 Virtual account data:", virtualAccountData)
        if (virtualAccountData.success && virtualAccountData.data) {
          setVirtualAccount({
            account_number: virtualAccountData.data.account_number || '',
            account_name: virtualAccountData.data.account_name || '',
            bank_name: virtualAccountData.data.bank_name || 'Stablesrail',
            currency: virtualAccountData.data.currency || 'NGN',
            assigned: virtualAccountData.data.assigned || false
          })
        }
      } else {
        console.log("❌ Virtual account response not ok:", virtualAccountRes.status, virtualAccountRes.statusText)
        try {
          const errorData = await virtualAccountRes.json()
          console.log("❌ Virtual account error data:", errorData)
        } catch (e) {
          console.log("❌ Could not parse virtual account error response")
        }
      }

      // Fetch account balance from database
      console.log("💰 Fetching account balance from database...")
      const balanceRes = await fetch("/api/account-balance")
      console.log("💰 Balance response status:", balanceRes.status)
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json()
        console.log("💰 Balance data from database:", balanceData)
        setAccountBalance(balanceData)
      } else {
        console.log("❌ Balance response not ok:", balanceRes.status, balanceRes.statusText)
        try {
          const errorData = await balanceRes.json()
          console.log("❌ Balance error data:", errorData)
        } catch (e) {
          console.log("❌ Could not parse balance error response")
        }
      }
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Message */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userName}
        </h1>
      </div>

      {/* Main Account Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="p-6">
          {/* Balance Section */}
          <div className="flex justify-between items-start mb-6">
            <div className="text-center w-full">
              <p className="text-blue-100 text-sm">Account Balance</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold">
                  {showBalance ? `₦${accountBalance?.balance?.toLocaleString() || '0'}` : '₦****'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-blue-500 p-1"
                  onClick={() => setShowBalance(!showBalance)}
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-blue-200 text-sm mt-1">
                & Loan Balance ₦{accountBalance?.loan_balance?.toLocaleString() || '0'}
              </p>
              {/* Debug info - remove in production */}
              <p className="text-blue-200 text-xs mt-1">
                Debug: Balance={accountBalance?.balance}, Loan={accountBalance?.loan_balance}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Link href="/account/fund">
              <Button variant="secondary" className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-50">
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Fund</span>
              </Button>
            </Link>
            
            <Link href="/account/transfer">
              <Button variant="secondary" className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-50">
                <ArrowLeftRight className="h-6 w-6" />
                <span className="text-sm font-medium">Transfer</span>
              </Button>
            </Link>
            
            <Link href="/loans">
              <Button variant="secondary" className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-50">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm font-medium">Loans</span>
              </Button>
            </Link>
          </div>

          {/* Virtual account removed */}
        </CardContent>
      </Card>

      {/* Additional Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-center">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent transactions</p>
              <Link href="/transactions">
                <Button variant="outline" className="mt-4">
                  View All Transactions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-center">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Deposits</span>
                <span className="font-semibold">₦0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Transfers</span>
                <span className="font-semibold">₦0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Loans</span>
                <span className="font-semibold text-red-600">₦0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
