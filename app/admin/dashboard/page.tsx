"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Users, 
  UserCheck, 
  Activity, 
  TrendingUp,
  BarChart3,
  ClipboardList,
  Clock,
  Calendar,
  RefreshCw
} from "lucide-react"
import { StatsCard } from "@/components/admin/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Stats {
  users: {
    total: number
    dau: number
    mau: number
    wau: number
    dauGrowth: number
    mauGrowth: number
    registrationsToday: number
    registrationsThisWeek: number
    registrationsThisMonth: number
  }
  transactions: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
    growth: number
  }
  activity: {
    postsToday: number
    postsThisWeek: number
    postsThisMonth: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      } else {
        console.error('Failed to fetch stats')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStats()
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
            <p className="text-slate-600 text-lg">Overview of platform statistics and activity</p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.users.total || 0}
          icon={Users}
          change={stats?.users.mauGrowth}
          changeLabel="vs last month"
        />
        <StatsCard
          title="Daily Active Users"
          value={stats?.users.dau || 0}
          icon={UserCheck}
          change={stats?.users.dauGrowth}
          changeLabel="vs yesterday"
        />
        <StatsCard
          title="Monthly Active Users"
          value={stats?.users.mau || 0}
          icon={Calendar}
          change={stats?.users.mauGrowth}
          changeLabel="vs last month"
        />
        <StatsCard
          title="Total Transactions"
          value={stats?.transactions.total || 0}
          icon={Activity}
          change={stats?.transactions.growth}
          changeLabel="vs last month"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Weekly Active Users"
          value={stats?.users.wau || 0}
          icon={TrendingUp}
        />
        <StatsCard
          title="Posts Today"
          value={stats?.activity.postsToday || 0}
          icon={Clock}
        />
        <StatsCard
          title="New Registrations Today"
          value={stats?.users.registrationsToday || 0}
          icon={Users}
        />
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Posts This Week</span>
                <span className="font-semibold">{stats?.activity.postsThisWeek || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Posts This Month</span>
                <span className="font-semibold">{stats?.activity.postsThisMonth || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Transactions Today</span>
                <span className="font-semibold">{stats?.transactions.today || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Transactions This Week</span>
                <span className="font-semibold">{stats?.transactions.thisWeek || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Registrations This Week</span>
                <span className="font-semibold">{stats?.users.registrationsThisWeek || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Registrations This Month</span>
                <span className="font-semibold">{stats?.users.registrationsThisMonth || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">DAU Growth</span>
                <span className={`font-semibold ${stats?.users.dauGrowth && stats.users.dauGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats?.users.dauGrowth && stats.users.dauGrowth > 0 ? '+' : ''}{stats?.users.dauGrowth || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">MAU Growth</span>
                <span className={`font-semibold ${stats?.users.mauGrowth && stats.users.mauGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats?.users.mauGrowth && stats.users.mauGrowth > 0 ? '+' : ''}{stats?.users.mauGrowth || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" asChild className="h-20 flex flex-col items-center justify-center">
              <Link href="/admin/users">
              <Users className="h-6 w-6 mb-2" />
              <span className="text-sm">Manage Users</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-20 flex flex-col items-center justify-center">
              <Link href="/admin/cases">
              <ClipboardList className="h-6 w-6 mb-2" />
              <span className="text-sm">Case Management</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-20 flex flex-col items-center justify-center">
              <Link href="/admin/offramp-requests">
              <Activity className="h-6 w-6 mb-2" />
              <span className="text-sm">Offramp Requests</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-20 flex flex-col items-center justify-center">
              <Link href="/admin/onramp-requests">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="text-sm">Onramp Requests</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
