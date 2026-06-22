"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export async function findBorrowers({
  amount,
  duration,
  durationUnit,
}: {
  amount: number
  duration: number
  durationUnit: string
}) {
  try {
    const adminClient = createAdminClient() as SupabaseClient<Database>

    // 1. Find all active borrower search subscriptions (loan_request_search)
    // Filter to those who searched for the EXACT same amount recently
    const { data: subscriptions, error: subError } = await adminClient
      .from("search_alert_subscriptions")
      .select("user_id, criteria, created_at, refreshed_at")
      .eq("search_kind", "loan_request_search")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())

    if (subError) {
      console.error("Error fetching borrower subscriptions:", subError)
      return { error: "Failed to fetch eligible borrowers" }
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, borrowers: [] }
    }

    // 2. Filter subscriptions: must have searched for the EXACT same amount
    // and the search must be recent (within last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const matchingUserIds = subscriptions
      .filter((sub: any) => {
        const criteria = sub.criteria || {}
        // Must match the exact loan amount
        const matchesAmount = criteria.loanAmount && criteria.loanAmount === amount
        // Search must be recent (refreshed_at or created_at within 30 days)
        const refreshedAt = sub.refreshed_at ? new Date(sub.refreshed_at) : null
        const createdAt = sub.created_at ? new Date(sub.created_at) : null
        const latestActivity = refreshedAt || createdAt
        const isRecent = latestActivity && latestActivity >= thirtyDaysAgo
        return matchesAmount && isRecent
      })
      .map((sub: any) => sub.user_id)

    if (matchingUserIds.length === 0) {
      return { success: true, borrowers: [] }
    }

    // 3. Exclude users who have ANY active loan (not just approved)
    // Active loan statuses: pending, approved, active, disbursed, funded, in_progress, processing
    const activeLoanStatuses = ["pending", "approved", "active", "disbursed", "funded", "in_progress", "processing"]
    const { data: activeLoans, error: activeLoanError } = await adminClient
      .from("loan_requests")
      .select("user_id")
      .in("status", activeLoanStatuses)
      .in("user_id", matchingUserIds)

    if (activeLoanError) {
      console.error("Error checking active loans:", activeLoanError)
      return { error: "Failed to validate borrower eligibility" }
    }

    const activeLoanUserIds = new Set((activeLoans || []).map((l: any) => l.user_id))
    const eligibleAfterLoanCheck = matchingUserIds.filter(id => !activeLoanUserIds.has(id))

    if (eligibleAfterLoanCheck.length === 0) {
      return { success: true, borrowers: [] }
    }

    // 4. Fetch profiles and filter for COMPLETED AND VERIFIED profiles
    // A completed & verified profile requires:
    // - first_name, last_name, phone_number, bvn, date_of_birth, address, city, state
    // - address_verified = true
    // - id_verified = true  
    // - profile_picture_url
    // - bank_name, account_number, account_name (withdrawal account)
    const { data: profiles, error: profileError } = await adminClient
      .from("profiles")
      .select(`
        id,
        username,
        first_name,
        last_name,
        profile_picture_url,
        phone_number,
        bvn,
        date_of_birth,
        address,
        city,
        state,
        address_verified,
        id_verified,
        bank_name,
        account_number,
        account_name
      `)
      .in("id", eligibleAfterLoanCheck)
      // Profile completion filters
      .not("first_name", "is", null)
      .not("last_name", "is", null)
      .not("phone_number", "is", null)
      .not("bvn", "is", null)
      .not("date_of_birth", "is", null)
      .not("address", "is", null)
      .not("city", "is", null)
      .not("state", "is", null)
      .not("profile_picture_url", "is", null)
      .not("bank_name", "is", null)
      .not("account_number", "is", null)
      .not("account_name", "is", null)
      .eq("address_verified", true)
      .eq("id_verified", true)

    if (profileError) {
      console.error("Error fetching profiles:", profileError)
      return { error: "Failed to fetch borrower profiles" }
    }

    // 5. Fetch aggregated loan stats for all eligible borrowers
    const profileIds = (profiles || []).map((p: any) => p.id)
    const statsMap: Record<string, { count: number; totalAmount: number; totalTenor: number; completedCount: number; eligibleCount: number }> = {}

    if (profileIds.length > 0) {
      const { data: loanStats, error: loanStatsError } = await adminClient
        .from("loan_requests")
        .select("user_id, amount, duration_months, status")
        .in("user_id", profileIds)

      if (loanStatsError) {
        console.error("Error fetching loan stats:", loanStatsError)
      } else {
        for (const loan of loanStats || []) {
          if (!statsMap[loan.user_id]) {
            statsMap[loan.user_id] = { count: 0, totalAmount: 0, totalTenor: 0, completedCount: 0, eligibleCount: 0 }
          }
          const s = statsMap[loan.user_id]
          if (!["cancelled", "rejected", "offer_pending"].includes(loan.status)) {
            s.count++
            s.totalAmount += Number(loan.amount || 0)
            s.totalTenor += Number(loan.duration_months || 0)
            s.eligibleCount++
            if (loan.status === "completed") s.completedCount++
          }
        }
      }
    }

    // Attach stats to each profile
    const enrichedProfiles = (profiles || []).map((p: any) => {
      const stats = statsMap[p.id] || { count: 0, totalAmount: 0, totalTenor: 0, completedCount: 0, eligibleCount: 0 }
      return {
        ...p,
        loans_taken_count: stats.count,
        total_amount_taken: stats.totalAmount,
        avg_tenor_months: stats.count > 0 ? Math.round(stats.totalTenor / stats.count) : 0,
        repayment_rate: stats.eligibleCount > 0 ? Math.round((stats.completedCount / stats.eligibleCount) * 100) : 0,
      }
    })

    return {
      success: true,
      borrowers: enrichedProfiles
    }
  } catch (error) {
    console.error("Unexpected error in findBorrowers:", error)
    return { error: "An unexpected error occurred while searching for borrowers" }
  }
}