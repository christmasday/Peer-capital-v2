import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth, createAdminResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const admin = createAdminClient()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Total users
    const { count: totalUsers } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Daily Active Users (DAU) - users who logged in today
    const { count: dau } = await admin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', today.toISOString())

    // Monthly Active Users (MAU) - users who logged in within last 30 days
    const { count: mau } = await admin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', thirtyDaysAgo.toISOString())

    // Weekly Active Users (WAU) - users who logged in within last 7 days
    const { count: wau } = await admin
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', sevenDaysAgo.toISOString())

    // Total transactions (from posts table as proxy)
    const { count: totalTransactions } = await admin
      .from('posts')
      .select('*', { count: 'exact', head: true })

    // Posts created today
    const { count: postsToday } = await admin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Posts created this week
    const { count: postsThisWeek } = await admin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Posts created this month
    const { count: postsThisMonth } = await admin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    // User registrations today
    const { count: registrationsToday } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // User registrations this week
    const { count: registrationsThisWeek } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // User registrations this month
    const { count: registrationsThisMonth } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Calculate growth percentages (mock data for now)
    const dauGrowth = dau ? Math.floor(Math.random() * 20) + 5 : 0 // 5-25% growth
    const mauGrowth = mau ? Math.floor(Math.random() * 15) + 3 : 0 // 3-18% growth
    const transactionGrowth = totalTransactions ? Math.floor(Math.random() * 30) + 10 : 0 // 10-40% growth

    const stats = {
      users: {
        total: totalUsers || 0,
        dau: dau || 0,
        mau: mau || 0,
        wau: wau || 0,
        dauGrowth,
        mauGrowth,
        registrationsToday: registrationsToday || 0,
        registrationsThisWeek: registrationsThisWeek || 0,
        registrationsThisMonth: registrationsThisMonth || 0,
      },
      transactions: {
        total: totalTransactions || 0,
        today: postsToday || 0,
        thisWeek: postsThisWeek || 0,
        thisMonth: postsThisMonth || 0,
        growth: transactionGrowth,
      },
      activity: {
        postsToday: postsToday || 0,
        postsThisWeek: postsThisWeek || 0,
        postsThisMonth: postsThisMonth || 0,
      }
    }

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
