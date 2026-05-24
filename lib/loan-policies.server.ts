"use server"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./supabase/database.types"
import { createAdminClient } from "./supabase/admin"
import { getTotalAmountGivenByLender } from "./actions/find-lenders"
import { durationToDays } from "./loan-limits"

type PolicyRow = {
  borrower_policies?: Array<{
    level?: number
    min?: number
    max?: number
    minTenorDays?: number
    maxTenorDays?: number
    interestMinPct?: number
    interestMaxPct?: number
  }>
  lender_tiers?: Array<{
    tier?: number
    min?: number
    max?: number
    minTenorDays?: number
    maxTenorDays?: number
    interestMinPct?: number
    interestMaxPct?: number
  }>
}

const DEFAULT_BORROWER_POLICIES = [
  { level: 1, min: 10000, max: 50000, minTenorDays: 7, maxTenorDays: 30, interestMinPct: 5, interestMaxPct: 15 },
  { level: 2, min: 50001, max: 100000, minTenorDays: 7, maxTenorDays: 30, interestMinPct: 5, interestMaxPct: 15 },
  { level: 3, min: 100001, max: 200000, minTenorDays: 7, maxTenorDays: 30, interestMinPct: 5, interestMaxPct: 15 },
  { level: 4, min: 200001, max: 300000, minTenorDays: 7, maxTenorDays: 60, interestMinPct: 5, interestMaxPct: 15 },
  { level: 5, min: 300001, max: 400000, minTenorDays: 7, maxTenorDays: 60, interestMinPct: 5, interestMaxPct: 15 },
  { level: 6, min: 400001, max: 500000, minTenorDays: 7, maxTenorDays: 60, interestMinPct: 5, interestMaxPct: 15 },
  { level: 7, min: 500001, max: 600000, minTenorDays: 7, maxTenorDays: 90, interestMinPct: 5, interestMaxPct: 15 },
  { level: 8, min: 600001, max: 700000, minTenorDays: 7, maxTenorDays: 90, interestMinPct: 5, interestMaxPct: 15 },
  { level: 9, min: 700001, max: 800000, minTenorDays: 7, maxTenorDays: 180, interestMinPct: 5, interestMaxPct: 15 },
  { level: 10, min: 800001, max: 900000, minTenorDays: 7, maxTenorDays: 180, interestMinPct: 5, interestMaxPct: 15 },
  { level: 11, min: 900001, max: 1000000, minTenorDays: 7, maxTenorDays: 365, interestMinPct: 5, interestMaxPct: 15 },
]

const DEFAULT_LENDER_TIERS = [
  { tier: 1, min: 10000, max: 500000, minTenorDays: 7, maxTenorDays: 60, interestMinPct: 5, interestMaxPct: 15 },
  { tier: 2, min: 500001, max: 1000000, minTenorDays: 90, maxTenorDays: 365, interestMinPct: 5, interestMaxPct: 15 },
  { tier: 3, min: 1000001, max: 5000000, minTenorDays: 180, maxTenorDays: 365, interestMinPct: 5, interestMaxPct: 15 },
]

async function loadPoliciesFromDb(): Promise<PolicyRow | null> {
  try {
    const adminClient = createAdminClient() as SupabaseClient<Database>
    const { data, error } = await adminClient.from("loan_policies").select("*").limit(1).maybeSingle()
    if (error || !data) return null
    return data as PolicyRow
  } catch {
    return null
  }
}

export async function getBorrowerPolicyForAmount(amount: number) {
  const db = await loadPoliciesFromDb()
  const policies = db?.borrower_policies ?? DEFAULT_BORROWER_POLICIES
  for (const policy of policies) {
    if ((policy.min === undefined || amount >= policy.min) && (policy.max === undefined || amount <= policy.max)) {
      return policy
    }
  }
  return policies[policies.length - 1]
}

export async function getLenderTierForAmount(amount: number) {
  const db = await loadPoliciesFromDb()
  const tiers = db?.lender_tiers ?? DEFAULT_LENDER_TIERS
  for (const tier of tiers) {
    if ((tier.min === undefined || amount >= tier.min) && (tier.max === undefined || amount <= tier.max)) {
      return tier
    }
  }
  return tiers[tiers.length - 1]
}

export async function getBorrowerMaxAmount(borrowerId: string): Promise<number> {
  try {
    const adminClient = createAdminClient() as SupabaseClient<Database>
    const { data, error } = await adminClient
      .from("loan_history")
      .select("amount")
      .eq("borrower_id", borrowerId)
      .in("status", ["repaid"])

    const defaultFirstMax = DEFAULT_BORROWER_POLICIES[0].max
    if (error || !data) return defaultFirstMax

    const totalRepaid = data.reduce((sum: number, row: any) => sum + (row.amount || 0), 0)
    for (let i = DEFAULT_BORROWER_POLICIES.length - 1; i >= 0; i--) {
      if (totalRepaid >= (DEFAULT_BORROWER_POLICIES[i].max || 0)) {
        const idx = Math.min(i + 1, DEFAULT_BORROWER_POLICIES.length - 1)
        return DEFAULT_BORROWER_POLICIES[idx].max
      }
    }

    return defaultFirstMax
  } catch {
    return DEFAULT_BORROWER_POLICIES[0].max
  }
}

export async function getLenderMaxAmount(lenderId: string): Promise<number> {
  try {
    const totalGiven = await getTotalAmountGivenByLender(lenderId)
    const tier = await getLenderTierForAmount(totalGiven)
    return tier?.max ?? DEFAULT_LENDER_TIERS[0].max
  } catch {
    return DEFAULT_LENDER_TIERS[0].max
  }
}

export async function getLenderTierForLender(lenderId: string) {
  try {
    const totalGiven = await getTotalAmountGivenByLender(lenderId)
    return await getLenderTierForAmount(totalGiven)
  } catch {
    return DEFAULT_LENDER_TIERS[0]
  }
}

export async function getLoanPolicySnapshot() {
  const db = await loadPoliciesFromDb()
  return {
    borrowerPolicies: db?.borrower_policies ?? DEFAULT_BORROWER_POLICIES,
    lenderTiers: db?.lender_tiers ?? DEFAULT_LENDER_TIERS,
  }
}

export { durationToDays }