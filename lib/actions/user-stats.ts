"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export async function getUserStats(userId: string) {
  try {
    const adminClient = createAdminClient() as SupabaseClient<Database>

    // Fetch profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, username, first_name, last_name, profile_picture_url")
      .eq("id", userId)
      .maybeSingle()

    // Fetch lending stats from loan_helpers
    const { data: helper } = await adminClient
      .from("loan_helpers")
      .select("loans_issued, amount_issued, max_loan_amount, interest_rate")
      .eq("user_id", userId)
      .maybeSingle()

    // Fetch borrowing stats from loan_requests
    const { data: loanRequests } = await adminClient
      .from("loan_requests")
      .select("amount, duration_months, status")
      .eq("user_id", userId)

    let loansTakenCount = 0
    let totalAmountTaken = 0
    let totalTenor = 0
    let completedCount = 0
    let eligibleCount = 0

    for (const loan of loanRequests || []) {
      if (!["cancelled", "rejected", "offer_pending"].includes(loan.status)) {
        loansTakenCount++
        totalAmountTaken += Number(loan.amount || 0)
        totalTenor += Number(loan.duration_months || 0)
        eligibleCount++
        if (loan.status === "completed") completedCount++
      }
    }

    return {
      success: true,
      profile: {
        displayName: profile?.username
          ? `@${profile.username}`
          : `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "User",
        avatarUrl: profile?.profile_picture_url || null,
      },
      lending: {
        loansIssued: helper?.loans_issued ?? 0,
        amountIssued: helper?.amount_issued ?? 0,
        maxLoanAmount: helper?.max_loan_amount ?? 0,
        interestRate: helper?.interest_rate ?? 0,
      },
      borrowing: {
        loansTakenCount,
        totalAmountTaken,
        avgTenorMonths: loansTakenCount > 0 ? Math.round(totalTenor / loansTakenCount) : 0,
        repaymentRate: eligibleCount > 0 ? Math.round((completedCount / eligibleCount) * 100) : 0,
      },
    }
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return { success: false, error: "Failed to load user stats" }
  }
}
