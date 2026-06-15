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

    // 1. Find all active borrower search subscriptions
    const { data: subscriptions, error: subError } = await adminClient
      .from("search_alert_subscriptions")
      .select("user_id, criteria")
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

    // 2. Filter subscriptions based on matching amount or tenure
    const matchingUserIds = subscriptions
      .filter((sub: any) => {
        const criteria = sub.criteria || {}
        const matchesAmount = criteria.loanAmount && criteria.loanAmount === amount
        const matchesDuration = criteria.loanDuration && 
                                criteria.loanDuration === duration && 
                                criteria.loanDurationUnit === durationUnit
        return matchesAmount || matchesDuration
      })
      .map((sub: any) => sub.user_id)

    if (matchingUserIds.length === 0) {
      return { success: true, borrowers: [] }
    }

    // 3. Exclude users who already have an approved loan
    const { data: approvedLoans, error: approvedError } = await adminClient
      .from("loan_requests")
      .select("user_id")
      .eq("status", "approved")
      .in("user_id", matchingUserIds)

    if (approvedError) {
      console.error("Error checking approved loans:", approvedError)
      return { error: "Failed to validate borrower eligibility" }
    }

    const approvedUserIds = new Set((approvedLoans || []).map((l: any) => l.user_id))
    const eligibleUserIds = matchingUserIds.filter(id => !approvedUserIds.has(id))

    if (eligibleUserIds.length === 0) {
      return { success: true, borrowers: [] }
    }

    // 4. Fetch profile details for eligible borrowers
    const { data: profiles, error: profileError } = await adminClient
      .from("profiles")
      .select("id, username, first_name, last_name, profile_picture_url")
      .in("id", eligibleUserIds)

    if (profileError) {
      console.error("Error fetching profiles:", profileError)
      return { error: "Failed to fetch borrower profiles" }
    }

    return { 
      success: true, 
      borrowers: profiles || [] 
    }
  } catch (error) {
    console.error("Unexpected error in findBorrowers:", error)
    return { error: "An unexpected error occurred while searching for borrowers" }
  }
}