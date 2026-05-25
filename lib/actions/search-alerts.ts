"use server"

import { createHash } from "crypto"
import { v4 as uuidv4 } from "uuid"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { createAdminClient } from "@/lib/supabase/admin"
import { durationToDays } from "@/lib/loan-limits"
import { createNotification } from "./notifications"
import { sendNotificationEmail } from "@/lib/notification-service"

export type SearchAlertKind = "lender_search" | "loan_request_search"
export type SearchAlertCriteria = {
  loanAmount?: number
  loanDuration?: number
  loanDurationUnit?: "days" | "months"
}

type SearchAlertSubscriptionRow = Database["public"]["Tables"]["search_alert_subscriptions"]["Row"]

type LenderOpportunity = {
  userId: string
  name: string
  loanAmount: number
  interestRate: number
  repaymentTime: number
  repaymentUnit: string
  profileImageUrl: string | null
}

type LoanRequestOpportunity = {
  id: string
  userId: string
  amount: number
  durationMonths: number
  purpose: string
}

const SEARCH_ALERT_TTL_DAYS = 7

function normalizeCriteria(criteria: SearchAlertCriteria) {
  return {
    loanAmount: typeof criteria.loanAmount === "number" && criteria.loanAmount > 0 ? criteria.loanAmount : undefined,
    loanDuration: typeof criteria.loanDuration === "number" && criteria.loanDuration > 0 ? criteria.loanDuration : undefined,
    loanDurationUnit: criteria.loanDurationUnit === "days" ? "days" : "months",
  }
}

function hashCriteria(criteria: SearchAlertCriteria) {
  return createHash("sha256").update(JSON.stringify(normalizeCriteria(criteria))).digest("hex")
}

function expiresAtFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function getDisplayName(profile: { username?: string | null; first_name?: string | null; last_name?: string | null } | null, fallback = "Loan Helper") {
  if (!profile) return fallback
  if (profile.username) return `@${profile.username}`
  const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
  return name || fallback
}

function criteriaMatchesLender(criteria: SearchAlertCriteria, lender: LenderOpportunity) {
  const normalized = normalizeCriteria(criteria)

  if (typeof normalized.loanAmount === "number" && lender.loanAmount < normalized.loanAmount) {
    return false
  }

  if (typeof normalized.loanDuration === "number") {
    const requestedDurationDays = durationToDays(normalized.loanDuration, normalized.loanDurationUnit)
    const lenderDurationDays = durationToDays(lender.repaymentTime, lender.repaymentUnit as "days" | "months")
    if (lenderDurationDays < requestedDurationDays) {
      return false
    }
  }

  return true
}

function criteriaMatchesLoanRequest(criteria: SearchAlertCriteria, request: LoanRequestOpportunity) {
  const normalized = normalizeCriteria(criteria)

  if (typeof normalized.loanAmount === "number" && request.amount < normalized.loanAmount) {
    return false
  }

  if (typeof normalized.loanDuration === "number") {
    const requestedDurationDays = durationToDays(normalized.loanDuration, normalized.loanDurationUnit)
    const requestDurationDays = durationToDays(request.durationMonths, "months")
    if (requestDurationDays < requestedDurationDays) {
      return false
    }
  }

  return true
}

async function hasExistingDeliveryRecord(
  adminClient: SupabaseClient<Database>,
  params: {
    subscriptionId: string
    entityType: string
    entityId: string
  },
) {
  const { data, error } = await adminClient
    .from("search_alert_deliveries")
    .select("id")
    .eq("subscription_id", params.subscriptionId)
    .eq("entity_type", params.entityType)
    .eq("entity_id", params.entityId)
    .maybeSingle()

  if (error) {
    return { success: false, error }
  }

  return { success: true, exists: Boolean(data) }
}

async function recordDelivery(
  adminClient: SupabaseClient<Database>,
  params: {
    subscriptionId: string
    userId: string
    searchKind: SearchAlertKind
    entityType: string
    entityId: string
    notificationId?: string
    payload: Record<string, any>
  },
) {
  const now = new Date().toISOString()
  const { error } = await adminClient.from("search_alert_deliveries").insert({
    id: uuidv4(),
    subscription_id: params.subscriptionId,
    user_id: params.userId,
    search_kind: params.searchKind,
    entity_type: params.entityType,
    entity_id: params.entityId,
    notification_id: params.notificationId || null,
    payload: params.payload,
    delivered_at: now,
    created_at: now,
    updated_at: now,
  })

  if (error) {
    return { success: false, error }
  }

  return { success: true }
}

export async function saveSearchAlertSubscription(input: {
  userId: string
  searchKind: SearchAlertKind
  criteria: SearchAlertCriteria
}) {
  try {
    const adminClient = createAdminClient()
    const now = new Date().toISOString()
    const normalizedCriteria = normalizeCriteria(input.criteria)
    const criteriaHash = hashCriteria(input.criteria)

    const { data, error } = await adminClient
      .from("search_alert_subscriptions")
      .upsert(
        {
          id: uuidv4(),
          user_id: input.userId,
          search_kind: input.searchKind,
          criteria: normalizedCriteria,
          criteria_hash: criteriaHash,
          status: "active",
          expires_at: expiresAtFromNow(SEARCH_ALERT_TTL_DAYS),
          refreshed_at: now,
          updated_at: now,
        },
        { onConflict: "user_id,search_kind,criteria_hash" },
      )
      .select("*")
      .single()

    if (error) {
      return { success: false, error }
    }

    return { success: true, subscription: data as SearchAlertSubscriptionRow }
  } catch (error) {
    return { success: false, error }
  }
}

async function getActiveSubscriptions(adminClient: SupabaseClient<Database>, searchKind: SearchAlertKind) {
  const { data, error } = await adminClient
    .from("search_alert_subscriptions")
    .select("*")
    .eq("search_kind", searchKind)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())

  if (error) {
    return { success: false as const, error }
  }

  return { success: true as const, subscriptions: (data || []) as SearchAlertSubscriptionRow[] }
}

async function notifySubscriptionMatch(params: {
  adminClient: SupabaseClient<Database>
  subscription: SearchAlertSubscriptionRow
  entityType: string
  entityId: string
  title: string
  description: string
  metadata: Record<string, any>
  targetPath: string
}) {
  const existingDelivery = await hasExistingDeliveryRecord(params.adminClient, {
    subscriptionId: params.subscription.id,
    entityType: params.entityType,
    entityId: params.entityId,
  })

  if (!existingDelivery.success) {
    return existingDelivery
  }

  if (existingDelivery.exists) {
    return { success: true, skipped: true }
  }

  const { success, notification, error } = await createNotification({
    userId: params.subscription.user_id,
    type: "loan_search_match",
    content: params.description,
    data: {
      ...params.metadata,
      targetPath: params.targetPath,
      searchKind: params.subscription.search_kind,
      subscriptionId: params.subscription.id,
      entityType: params.entityType,
      entityId: params.entityId,
    },
  })

  if (!success || error) {
    return { success: false, error }
  }

  await sendNotificationEmail({
    type: "loan_search_match",
    userId: params.subscription.user_id,
    title: params.title,
    description: params.description,
    metadata: {
      ...params.metadata,
      targetPath: params.targetPath,
      searchKind: params.subscription.search_kind,
      subscriptionId: params.subscription.id,
      entityType: params.entityType,
      entityId: params.entityId,
    },
  })

  const delivery = await recordDelivery(params.adminClient, {
    subscriptionId: params.subscription.id,
    userId: params.subscription.user_id,
    searchKind: params.subscription.search_kind as SearchAlertKind,
    entityType: params.entityType,
    entityId: params.entityId,
    notificationId: notification?.id,
    payload: params.metadata,
  })

  if (!delivery.success) {
    return delivery
  }

  return { success: true, notification }
}

export async function scanLenderSearchAlertsForUser(userId: string) {
  try {
    const adminClient = createAdminClient()

    const [profileResult, helperSettingsResult, helperResult] = await Promise.all([
      adminClient
        .from("profiles")
        .select("id, username, first_name, last_name, profile_picture_url")
        .eq("id", userId)
        .maybeSingle(),
      adminClient
        .from("loan_helper_settings")
        .select("loan_amount, interest_rate, repayment_time, repayment_unit")
        .eq("user_id", userId)
        .maybeSingle(),
      adminClient
        .from("loan_helpers")
        .select("name, profile_image_url")
        .eq("user_id", userId)
        .maybeSingle(),
    ])

    if (profileResult.error || helperSettingsResult.error) {
      return { success: false, error: profileResult.error || helperSettingsResult.error }
    }

    const settings = helperSettingsResult.data
    if (!settings) {
      return { success: true, matched: 0 }
    }

    const lender: LenderOpportunity = {
      userId,
      name: getDisplayName(profileResult.data as any, helperResult.data?.name || "Loan Helper"),
      loanAmount: Number(settings.loan_amount || 0),
      interestRate: Number(settings.interest_rate || 0),
      repaymentTime: Number(settings.repayment_time || 0),
      repaymentUnit: settings.repayment_unit || "months",
      profileImageUrl: helperResult.data?.profile_image_url ?? profileResult.data?.profile_picture_url ?? null,
    }

    const subscriptionsResult = await getActiveSubscriptions(adminClient, "lender_search")
    if (!subscriptionsResult.success) {
      return { success: false, error: subscriptionsResult.error }
    }

    let matched = 0
    for (const subscription of subscriptionsResult.subscriptions) {
      if (subscription.user_id === userId) continue
      const criteria = (subscription.criteria || {}) as SearchAlertCriteria
      if (!criteriaMatchesLender(criteria, lender)) continue

      const delivery = await notifySubscriptionMatch({
        adminClient,
        subscription,
        entityType: "loan_helper",
        entityId: userId,
        title: "A borrower search matches your lending goal",
        description: `A borrower search now closely matches the loan amount and repayment terms you want to fund.`,
        metadata: {
          searchKind: "lender_search",
          lenderId: userId,
          lenderName: lender.name,
          lenderAmount: lender.loanAmount,
          lenderInterestRate: lender.interestRate,
          repaymentTime: lender.repaymentTime,
          repaymentUnit: lender.repaymentUnit,
          profileImageUrl: lender.profileImageUrl,
          searchCriteria: criteria,
          offerActionUrl: `/api/search-alerts/send-offer?subscriptionId=${subscription.id}&entityId=${userId}`,
        },
        targetPath: `/api/search-alerts/send-offer?subscriptionId=${subscription.id}&entityId=${userId}`,
      })

      if (delivery.success) {
        matched += 1
      }
    }

    return { success: true, matched }
  } catch (error) {
    return { success: false, error }
  }
}

export async function scanLoanRequestSearchAlertsForRequest(loanRequestId: string) {
  try {
    const adminClient = createAdminClient()

    const { data: request, error: requestError } = await adminClient
      .from("loan_requests")
      .select("id, user_id, amount, duration_months, purpose")
      .eq("id", loanRequestId)
      .maybeSingle()

    if (requestError || !request) {
      return { success: false, error: requestError || new Error("Loan request not found") }
    }

    const subscriptionsResult = await getActiveSubscriptions(adminClient, "loan_request_search")
    if (!subscriptionsResult.success) {
      return { success: false, error: subscriptionsResult.error }
    }

    const requestOpportunity: LoanRequestOpportunity = {
      id: request.id,
      userId: request.user_id,
      amount: Number(request.amount || 0),
      durationMonths: Number(request.duration_months || 0),
      purpose: String(request.purpose || ""),
    }

    let matched = 0
    for (const subscription of subscriptionsResult.subscriptions) {
      if (subscription.user_id === requestOpportunity.userId) continue
      const criteria = (subscription.criteria || {}) as SearchAlertCriteria
      if (!criteriaMatchesLoanRequest(criteria, requestOpportunity)) continue

      const delivery = await notifySubscriptionMatch({
        adminClient,
        subscription,
        entityType: "loan_request",
        entityId: requestOpportunity.id,
        title: "A loan request matches your saved search",
        description: `A new loan request for ₦${requestOpportunity.amount.toLocaleString()} now matches the criteria you saved.`,
        metadata: {
          loanRequestId: requestOpportunity.id,
          borrowerId: requestOpportunity.userId,
          amount: requestOpportunity.amount,
          durationMonths: requestOpportunity.durationMonths,
          purpose: requestOpportunity.purpose,
          searchCriteria: criteria,
        },
        targetPath: "/loans",
      })

      if (delivery.success) {
        matched += 1
      }
    }

    return { success: true, matched }
  } catch (error) {
    return { success: false, error }
  }
}
