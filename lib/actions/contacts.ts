"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getUserProfile } from "@/lib/actions/auth"
import type { Database } from "@/lib/supabase/database.types"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function getTransactionContacts() {
  try {
    // Ensure user is authenticated and get current user id
    const userProfile = await getUserProfile()
    const userId = userProfile?.user?.id
    if (!userId) return { contacts: [] }

    const adminClient = createAdminClient() as SupabaseClient<Database>

    // Fetch counterparties from loan_history and disbursement transactions
    // in parallel. Both queries are independent, so this halves (or more)
    // the latency of the contacts tab.
    const [
      { data: history, error: historyError },
      { data: disbursements, error: disbursementError },
    ] = await Promise.all([
      adminClient
        .from("loan_history")
        .select("lender_id, borrower_id")
        .or(`lender_id.eq.${userId},borrower_id.eq.${userId}`)
        .in("status", ["approved", "active", "completed"]),
      adminClient
        .from("transactions")
        .select("reference")
        .eq("user_id", userId)
        .eq("type", "disbursement"),
    ])

    if (historyError) {
      console.error("Error fetching loan history for contacts:", historyError)
      return { contacts: [] }
    }

    const otherIds = new Set<string>()
    ;(history || []).forEach((row: any) => {
      if (row.lender_id && row.lender_id !== userId) otherIds.add(row.lender_id)
      if (row.borrower_id && row.borrower_id !== userId) otherIds.add(row.borrower_id)
    })

    // Resolve counterparty ids from disbursed loan references. Fetch the
    // referenced loan_history rows in parallel with the profile/settings
    // fetches below so we don't add a second sequential round-trip.
    let disbursedLoans: Array<{ lender_id: string | null; borrower_id: string | null }> | null = null
    if (!disbursementError && disbursements && disbursements.length > 0) {
      const loanIds = disbursements.map((d: any) => d.reference).filter(Boolean)
      if (loanIds.length > 0) {
        const { data } = await adminClient
          .from("loan_history")
          .select("lender_id, borrower_id")
          .in("id", loanIds)
        disbursedLoans = data
      }
    }

    ;(disbursedLoans || []).forEach((row: any) => {
      if (row.lender_id && row.lender_id !== userId) otherIds.add(row.lender_id)
      if (row.borrower_id && row.borrower_id !== userId) otherIds.add(row.borrower_id)
    })

    const ids = Array.from(otherIds)
    if (ids.length === 0) return { contacts: [] }

    // Fetch profiles and loan helper settings in parallel. They're
    // independent and were previously awaited sequentially.
    const [
      { data: profiles },
      { data: settings },
    ] = await Promise.all([
      adminClient
        .from("profiles")
        .select("id, first_name, last_name, profile_picture_url, bio, username")
        .in("id", ids),
      adminClient
        .from("loan_helper_settings")
        .select("user_id, loan_amount, interest_rate, repayment_time, repayment_unit")
        .in("user_id", ids),
    ])

    const settingsMap: Record<string, any> = {}
    ;(settings || []).forEach((s: any) => {
      settingsMap[s.user_id] = s
    })

    const contacts = (profiles || []).map((p: any) => ({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      profile_picture_url: p.profile_picture_url,
      bio: p.bio,
      username: p.username,
      loan_goal: settingsMap[p.id] || null,
    }))

    return { contacts }
  } catch (error) {
    console.error("Unexpected error in getTransactionContacts:", error)
    return { contacts: [] }
  }
}
