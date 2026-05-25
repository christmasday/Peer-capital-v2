"use server"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./supabase/database.types"
import { createAdminClient } from "./supabase/admin"
import { getTotalAmountGivenByLender } from "./actions/lender-stats.server"
import { durationToDays } from "./loan-limits"
import { getProfileMetrics } from "./actions/profile-metrics"

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
  { level: 1, min: 10000, max: 50000, minTenorDays: 7, maxTenorDays: 30, interestMinPct: 5, interestMaxPct: 20 },
  { level: 2, min: 50001, max: 100000, minTenorDays: 7, maxTenorDays: 30, interestMinPct: 5, interestMaxPct: 20 },
  { level: 3, min: 100001, max: 200000, minTenorDays: 7, maxTenorDays: 30, interestMinPct: 5, interestMaxPct: 20 },
  { level: 4, min: 200001, max: 300000, minTenorDays: 7, maxTenorDays: 60, interestMinPct: 5, interestMaxPct: 20 },
  { level: 5, min: 300001, max: 400000, minTenorDays: 7, maxTenorDays: 60, interestMinPct: 5, interestMaxPct: 20 },
  { level: 6, min: 400001, max: 500000, minTenorDays: 7, maxTenorDays: 60, interestMinPct: 5, interestMaxPct: 20 },
  { level: 7, min: 500001, max: 600000, minTenorDays: 7, maxTenorDays: 90, interestMinPct: 5, interestMaxPct: 20 },
  { level: 8, min: 600001, max: 700000, minTenorDays: 7, maxTenorDays: 90, interestMinPct: 5, interestMaxPct: 20 },
  { level: 9, min: 700001, max: 800000, minTenorDays: 7, maxTenorDays: 180, interestMinPct: 5, interestMaxPct: 20 },
  { level: 10, min: 800001, max: 900000, minTenorDays: 7, maxTenorDays: 180, interestMinPct: 5, interestMaxPct: 20 },
  { level: 11, min: 900001, max: 1000000, minTenorDays: 7, maxTenorDays: 365, interestMinPct: 5, interestMaxPct: 20 },
]

const DEFAULT_LENDER_TIERS = [
  { tier: 1, min: 10000, max: 500000, minTenorDays: 7, maxTenorDays: 60, interestMinPct: 5, interestMaxPct: 20 },
  { tier: 2, min: 500001, max: 1000000, minTenorDays: 90, maxTenorDays: 365, interestMinPct: 5, interestMaxPct: 20 },
  { tier: 3, min: 1000001, max: 5000000, minTenorDays: 180, maxTenorDays: 365, interestMinPct: 5, interestMaxPct: 20 },
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

type AdminConfigRow = {
  config_key: string
  config_value: string
}

const LENDER_INTEREST_RATE_MIN_KEY = "lender_interest_rate_min_pct"
const LENDER_INTEREST_RATE_MAX_KEY = "lender_interest_rate_max_pct"

function parseRateValue(value: string | null | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function loadLenderInterestRateLimitsFromConfig(): Promise<{ minPct: number; maxPct: number }> {
  try {
    const adminClient = createAdminClient() as SupabaseClient<Database>
    const { data } = await adminClient
      .from("admin_config")
      .select("config_key, config_value")
      .in("config_key", [LENDER_INTEREST_RATE_MIN_KEY, LENDER_INTEREST_RATE_MAX_KEY])

    const rows = (data || []) as AdminConfigRow[]
    const minPct = Math.max(0, Math.min(20, parseRateValue(rows.find((row) => row.config_key === LENDER_INTEREST_RATE_MIN_KEY)?.config_value, 5)))
    const maxPct = Math.max(minPct, Math.min(20, parseRateValue(rows.find((row) => row.config_key === LENDER_INTEREST_RATE_MAX_KEY)?.config_value, 20)))

    return { minPct, maxPct }
  } catch {
    return { minPct: 5, maxPct: 20 }
  }
}

export async function getLenderInterestRateLimits(): Promise<{ minPct: number; maxPct: number }> {
  return loadLenderInterestRateLimitsFromConfig()
}

function applyLenderInterestLimits(
  tiers: NonNullable<PolicyRow["lender_tiers"]>,
  minPct: number,
  maxPct: number,
) {
  return tiers.map((tier) => ({
    ...tier,
    interestMinPct: minPct,
    interestMaxPct: maxPct,
  }))
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
  const limits = await loadLenderInterestRateLimitsFromConfig()
  const tiers = applyLenderInterestLimits((db?.lender_tiers ?? DEFAULT_LENDER_TIERS) as NonNullable<PolicyRow["lender_tiers"]>, limits.minPct, limits.maxPct)
  for (const tier of tiers) {
    if ((tier.min === undefined || amount >= tier.min) && (tier.max === undefined || amount <= tier.max)) {
      return tier
    }
  }
  return tiers[tiers.length - 1]
}

export async function getBorrowerMaxAmount(borrowerId: string): Promise<number> {
  try {
    const metrics = await getProfileMetrics(borrowerId)
    const levelIndex = Math.max(0, Math.min(DEFAULT_BORROWER_POLICIES.length - 1, metrics.creditLevel - 1))
    return DEFAULT_BORROWER_POLICIES[levelIndex].max || DEFAULT_BORROWER_POLICIES[0].max
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
  const limits = await loadLenderInterestRateLimitsFromConfig()
  return {
    borrowerPolicies: db?.borrower_policies ?? DEFAULT_BORROWER_POLICIES,
    lenderTiers: applyLenderInterestLimits((db?.lender_tiers ?? DEFAULT_LENDER_TIERS) as NonNullable<PolicyRow["lender_tiers"]>, limits.minPct, limits.maxPct),
  }
}

export { durationToDays }