"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { getBlockedUsers } from "@/lib/actions/connections"
import { durationToDays } from "@/lib/loan-limits"

export type LenderSearchParams = {
  loanAmount?: number
  loanDuration?: number
  loanDurationUnit?: "days" | "months"
  page?: number
  pageSize?: number
}

export type LenderResult = {
  id: string
  name: string
  interest_rate: number
  max_loan_amount: number
  loans_issued: number
  amount_issued: number
  profile_image_url: string | null
  rating?: number
  repayment_time: number
  repayment_unit?: string
}

type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  profile_picture_url: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  lending_license_url?: string | null
  phone_number?: string | null
  bank_name?: string | null
  account_number?: string | null
  bvn?: string | null
  date_of_birth?: string | null
}

type HelperSettingsRow = {
  user_id: string
  loan_amount: number
  interest_rate: number
  repayment_time: number
  repayment_unit: string | null
}

type LoanHelperRow = {
  user_id: string
  name: string | null
  max_loan_amount: number | null
  loans_issued: number | null
  amount_issued: number | null
  profile_image_url: string | null
}

type SearchCandidate = {
  id: string
  name: string
  interest_rate: number
  max_loan_amount: number
  loans_issued: number
  amount_issued: number
  profile_image_url: string | null
  rating?: number
  repayment_time: number
  repayment_unit?: string
  locationRank: number
  locationName: string
}

function normalizeLocationPart(value: string | null | undefined): string {
  return value ? value.trim().toLowerCase() : ""
}

function getLocationRank(origin: ProfileRow | null, target: ProfileRow | null): number {
  if (!origin || !target) {
    return Number.MAX_SAFE_INTEGER
  }

  const originAddress = normalizeLocationPart(origin.address)
  const originCity = normalizeLocationPart(origin.city)
  const originState = normalizeLocationPart(origin.state)
  const originCountry = normalizeLocationPart(origin.country)
  const targetAddress = normalizeLocationPart(target.address)
  const targetCity = normalizeLocationPart(target.city)
  const targetState = normalizeLocationPart(target.state)
  const targetCountry = normalizeLocationPart(target.country)

  if (originAddress && targetAddress && originAddress === targetAddress && originCity === targetCity && originState === targetState && originCountry === targetCountry) {
    return 0
  }

  if (originCity && targetCity && originCity === targetCity && originState === targetState && originCountry === targetCountry) {
    return 1
  }

  if (originState && targetState && originState === targetState && originCountry === targetCountry) {
    return 2
  }

  if (originCountry && targetCountry && originCountry === targetCountry) {
    return 3
  }

  return 4
}

function buildDisplayName(profile: ProfileRow | null, fallbackName: string | null | undefined = null): string {
  const fallback = fallbackName?.trim() || "Loan Helper"
  if (!profile) return fallback
  const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
  return name || fallback
}

export async function findLenders({ loanAmount, loanDuration, loanDurationUnit = "months", page = 1, pageSize = 12 }: LenderSearchParams): Promise<{
  lenders: LenderResult[]
  error: string | null
  hasMore?: boolean
  page?: number
  pageSize?: number
}> {
  try {
    // Validate input - at least one parameter must be provided
    if ((loanAmount === undefined || loanAmount <= 0) && (loanDuration === undefined || loanDuration <= 0)) {
      return { lenders: [], error: "Please enter either a loan amount or duration", hasMore: false }
    }

    const safePage = Math.max(1, Math.floor(page))
    const safePageSize = Math.min(24, Math.max(1, Math.floor(pageSize)))
    const offset = (safePage - 1) * safePageSize

    // Create Supabase client
    const { checkAuth } = await import("@/lib/auth-utils");
    const authStatus = await checkAuth();
    const currentUserId = authStatus?.userId || null;
    if (!currentUserId) {
      return { lenders: [], error: "You must be logged in to search for lenders.", hasMore: false };
    }

    const adminClient = createAdminClient();
    const requestedDurationDays = loanDuration !== undefined && loanDuration > 0
      ? durationToDays(loanDuration, loanDurationUnit)
      : undefined

    const { blocked } = await getBlockedUsers();

    const { data: currentProfile } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name, profile_picture_url, address, city, state, country")
      .eq("id", currentUserId)
      .maybeSingle()

    const { data: settingsRows, error: settingsError } = await adminClient
      .from("loan_helper_settings")
      .select("user_id, loan_amount, interest_rate, repayment_time, repayment_unit")
      .gt("loan_amount", 0)
      .gt("interest_rate", 0)
      .gt("repayment_time", 0)

    if (settingsError) {
      return { lenders: [], error: "Failed to find lenders", hasMore: false }
    }

    const rows = (settingsRows || []) as HelperSettingsRow[]
    if (rows.length === 0) {
      return { lenders: [], error: "No lenders found matching your criteria.", hasMore: false }
    }

    const userIds = rows.map((row) => row.user_id)

    const [profilesResult, helpersResult] = await Promise.all([
      adminClient
        .from("profiles")
        .select("id, first_name, last_name, profile_picture_url, address, city, state, country, lending_license_url, phone_number, bank_name, account_number, bvn, date_of_birth")
        .in("id", userIds),
      adminClient
        .from("loan_helpers")
        .select("user_id, name, max_loan_amount, loans_issued, amount_issued, profile_image_url")
        .in("user_id", userIds),
    ])

    if (profilesResult.error) {
      return { lenders: [], error: "Failed to load lender profiles", hasMore: false }
    }

    const profileMap = new Map<string, ProfileRow>((profilesResult.data || []).map((profile) => [profile.id, profile as ProfileRow]))
    const helperMap = new Map<string, LoanHelperRow>((helpersResult.data || []).map((helper) => [helper.user_id, helper as LoanHelperRow]))

    const candidates: SearchCandidate[] = []

    for (const row of rows) {
      const userId = row.user_id

      if (blocked.includes(userId)) continue

      const lenderProfile = profileMap.get(userId) || null
      if (!lenderProfile) continue

      const helperStats = helperMap.get(userId)
      const lenderDurationDays = durationToDays(row.repayment_time || 0, row.repayment_unit || "months")

      if (requestedDurationDays !== undefined && requestedDurationDays > 0 && lenderDurationDays < requestedDurationDays) {
        continue
      }

      const maxLoanAmount = helperStats?.max_loan_amount ?? row.loan_amount
      if (loanAmount !== undefined && loanAmount > 0 && maxLoanAmount < loanAmount) {
        continue
      }

      const isProfileComplete =
        lenderProfile.first_name &&
        lenderProfile.last_name &&
        lenderProfile.phone_number &&
        lenderProfile.address &&
        lenderProfile.city &&
        lenderProfile.state &&
        lenderProfile.bank_name &&
        lenderProfile.account_number &&
        lenderProfile.bvn &&
        lenderProfile.date_of_birth

      if ((maxLoanAmount > 2000000) && (!isProfileComplete || !lenderProfile.lending_license_url)) {
        continue
      }

      candidates.push({
        id: userId,
        name: buildDisplayName(lenderProfile, helperStats?.name),
        interest_rate: row.interest_rate,
        max_loan_amount: maxLoanAmount,
        loans_issued: helperStats?.loans_issued ?? 0,
        amount_issued: helperStats?.amount_issued ?? 0,
        profile_image_url: helperStats?.profile_image_url ?? lenderProfile.profile_picture_url,
        rating: undefined,
        repayment_time: row.repayment_time,
        repayment_unit: row.repayment_unit || undefined,
        locationRank: getLocationRank(currentProfile as ProfileRow | null, lenderProfile),
        locationName: `${lenderProfile.city || ""}, ${lenderProfile.state || ""}`.replace(/^,\s*|,\s*$/g, "") || lenderProfile.country || "",
      })
    }

    candidates.sort((left, right) => {
      if (left.locationRank !== right.locationRank) return left.locationRank - right.locationRank
      if (right.max_loan_amount !== left.max_loan_amount) return right.max_loan_amount - left.max_loan_amount
      return left.name.localeCompare(right.name)
    })

    const pagedCandidates = candidates.slice(offset, offset + safePageSize)
    const hasMore = offset + safePageSize < candidates.length

    const lenders: LenderResult[] = []
    for (const candidate of pagedCandidates) {
      lenders.push({
        id: candidate.id,
        name: candidate.name,
        interest_rate: candidate.interest_rate,
        max_loan_amount: candidate.max_loan_amount,
        loans_issued: candidate.loans_issued,
        amount_issued: candidate.amount_issued,
        profile_image_url: candidate.profile_image_url,
        rating: candidate.rating,
        repayment_time: candidate.repayment_time,
        repayment_unit: candidate.repayment_unit,
      })
    }

    if (safePage === 1 && lenders.length === 0) {
      let errorMessage = "No lenders found matching your criteria."

      if (loanAmount !== undefined && loanDuration !== undefined) {
        errorMessage += " Try adjusting your loan amount or duration."
      } else if (loanAmount !== undefined) {
        errorMessage += " Try a different loan amount."
      } else if (loanDuration !== undefined) {
        errorMessage += " Try a different loan duration."
      }
      return { lenders: [], error: errorMessage, hasMore: false, page: safePage, pageSize: safePageSize }
    }

    if (safePage === 1) {
      try {
        const { createNotificationsForUsers } = await import("@/lib/actions/notifications")
        const { data: allProfiles } = await adminClient.from("profiles").select("id")
        if (allProfiles && allProfiles.length > 0) {
          const userIds = allProfiles.map((p: any) => p.id)
          await createNotificationsForUsers({
            userIds,
            type: "loan_search",
            data: { loanAmount, loanDuration, loanDurationUnit },
          })
        }
      } catch (notifyErr) {
        // non-fatal
      }
    }

    return { lenders: lenders, error: null, hasMore, page: safePage, pageSize: safePageSize }
  } catch (error) {
    return { lenders: [], error: "An unexpected error occurred", hasMore: false }
  }
}
