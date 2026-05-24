"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

// Returns the maximum loan amount ever offered by a lender (all loans in history)
export async function getMaxLoanAmountByLender(lenderId: string): Promise<number> {
  const adminClient = createAdminClient() as SupabaseClient<Database>
  const { data, error } = await adminClient
    .from("loan_history")
    .select("amount")
    .eq("lender_id", lenderId)
    .order("amount", { ascending: false })
    .limit(1)
  if (error || !data || data.length === 0) return 0
  return data[0].amount || 0
}

// Returns the total amount of money given in loans by a lender (approved or completed loans)
export async function getTotalAmountGivenByLender(lenderId: string): Promise<number> {
  const adminClient = createAdminClient() as SupabaseClient<Database>
  const { data, error } = await adminClient
    .from("loan_history")
    .select("amount")
    .eq("lender_id", lenderId)
    .in("status", ["approved", "repaid"]) // Only count successful loans
  if (error || !data) return 0
  return data.reduce((sum: number, row: { amount: number }) => sum + (row.amount || 0), 0)
}
