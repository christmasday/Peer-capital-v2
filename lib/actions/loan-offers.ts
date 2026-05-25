"use server"

import { v4 as uuidv4 } from "uuid"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserId } from "@/lib/auth-utils"
import { createNotification } from "@/lib/actions/notifications"
import { sendNotificationEmail } from "@/lib/notification-service"
import { revalidatePath } from "next/cache"

type LoanRequestRow = Database["public"]["Tables"]["loan_requests"]["Row"] & {
  loan_helpers?: {
    name: string | null
    profile_image_url: string | null
    user_id: string | null
  } | null
}

export async function createLoanOfferFromSearchAlert(input: {
  subscriptionId: string
  lenderUserId: string
  deliveryEntityId: string
}) {
  try {
    const currentUserId = await getCurrentUserId()
    if (!currentUserId || currentUserId !== input.lenderUserId) {
      return { success: false, error: new Error("You are not authorized to send this offer") }
    }

    const adminClient = createAdminClient() as SupabaseClient<Database>

    const { data: delivery, error: deliveryError } = await adminClient
      .from("search_alert_deliveries")
      .select("*")
      .eq("subscription_id", input.subscriptionId)
      .eq("entity_id", input.deliveryEntityId)
      .eq("user_id", input.lenderUserId)
      .eq("search_kind", "lender_search")
      .maybeSingle()

    if (deliveryError || !delivery) {
      return { success: false, error: deliveryError || new Error("Search alert delivery not found") }
    }

    const { data: subscription, error: subscriptionError } = await adminClient
      .from("search_alert_subscriptions")
      .select("*")
      .eq("id", input.subscriptionId)
      .maybeSingle()

    if (subscriptionError || !subscription) {
      return { success: false, error: subscriptionError || new Error("Search alert subscription not found") }
    }

    const { data: helper, error: helperError } = await adminClient
      .from("loan_helpers")
      .select("id, name, profile_image_url, user_id")
      .eq("user_id", input.lenderUserId)
      .maybeSingle()

    if (helperError || !helper) {
      return { success: false, error: helperError || new Error("Lender profile not found") }
    }

    const { data: settings, error: settingsError } = await adminClient
      .from("loan_helper_settings")
      .select("loan_amount, interest_rate, repayment_time, repayment_unit")
      .eq("user_id", input.lenderUserId)
      .maybeSingle()

    if (settingsError || !settings) {
      return { success: false, error: settingsError || new Error("Lender loan settings not found") }
    }

    const offerId = uuidv4()
    const borrowerId = subscription.user_id
    const amount = Number(settings.loan_amount || 0)
    const interestRate = Number(settings.interest_rate || 0)
    const duration = Number(settings.repayment_time || 0)
    const durationUnit = settings.repayment_unit || "months"
    const purpose = `Loan offer from ${helper.name || "a lender"}`

    const { data: offer, error: offerError } = await adminClient
      .from("loan_requests")
      .insert({
        id: offerId,
        user_id: borrowerId,
        helper_id: helper.id,
        amount,
        interest_rate: interestRate,
        duration_months: duration,
        duration_unit: durationUnit,
        status: "offer_pending",
        purpose,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .select("*")
      .single()

    if (offerError || !offer) {
      return { success: false, error: offerError || new Error("Failed to create loan offer") }
    }

    const offerPath = `/loan-offers/${offerId}`
    await createNotification({
      userId: borrowerId,
      actorId: input.lenderUserId,
      type: "loan_offer",
      content: `${helper.name || "A lender"} sent you a loan offer. Review the terms before you decide.`,
      data: {
        loanRequestId: offerId,
        lenderId: input.lenderUserId,
        lenderName: helper.name || "A lender",
        lenderImageUrl: helper.profile_image_url,
        amount,
        interestRate,
        duration,
        durationUnit,
        purpose,
        subscriptionId: input.subscriptionId,
        deliveryEntityId: input.deliveryEntityId,
        targetPath: offerPath,
      },
    })

    await sendNotificationEmail({
      type: "loan_offer",
      userId: borrowerId,
      title: "New loan offer",
      description: `${helper.name || "A lender"} has sent a loan offer for you to review.`,
      metadata: {
        lenderName: helper.name || "A lender",
        amount,
        interestRate,
        duration,
        durationUnit,
        purpose,
        targetPath: offerPath,
      },
    })

    revalidatePath("/loans")
    revalidatePath(offerPath)

    return { success: true, offer }
  } catch (error) {
    return { success: false, error }
  }
}

export async function getLoanOfferById(loanRequestId: string, userId?: string) {
  try {
    const adminClient = createAdminClient() as SupabaseClient<Database>
    const { data, error } = await adminClient
      .from("loan_requests")
      .select(`
        *,
        loan_helpers (
          id,
          name,
          profile_image_url,
          user_id
        )
      `)
      .eq("id", loanRequestId)
      .maybeSingle()

    if (error || !data) {
      return { success: false, error: error || new Error("Offer not found") }
    }

    const offer = data as LoanRequestRow
    if (userId && offer.user_id !== userId && offer.loan_helpers?.user_id !== userId) {
      return { success: false, error: new Error("You do not have access to this offer") }
    }

    return { success: true, offer }
  } catch (error) {
    return { success: false, error }
  }
}

export async function respondToLoanOffer(input: {
  loanRequestId: string
  decision: "accept" | "reject"
  userId: string
}) {
  try {
    const adminClient = createAdminClient() as SupabaseClient<Database>
    const { data: offer, error: fetchError } = await adminClient
      .from("loan_requests")
      .select(`
        *,
        loan_helpers (
          id,
          name,
          profile_image_url,
          user_id
        )
      `)
      .eq("id", input.loanRequestId)
      .maybeSingle()

    if (fetchError || !offer) {
      return { success: false, error: fetchError || new Error("Offer not found") }
    }

    if (offer.user_id !== input.userId) {
      return { success: false, error: new Error("You are not authorized to update this offer") }
    }

    const nextStatus = input.decision === "accept" ? "approved" : "rejected"

    const { error: updateError } = await adminClient
      .from("loan_requests")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.loanRequestId)

    if (updateError) {
      return { success: false, error: updateError }
    }

    await adminClient.from("loan_history").insert({
      loan_request_id: input.loanRequestId,
      lender_id: offer.helper_id,
      borrower_id: offer.user_id,
      amount: offer.amount,
      interest_rate: offer.interest_rate,
      duration: offer.duration_months,
      duration_unit: (offer as any).duration_unit || "months",
      status: nextStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)

    const lenderUserId = offer.loan_helpers?.user_id || null
    if (lenderUserId) {
      const eventType = input.decision === "accept" ? "loan_offer_accepted" : "loan_offer_rejected"
      const title = input.decision === "accept" ? "Loan offer accepted" : "Loan offer rejected"
      const description = input.decision === "accept"
        ? "The borrower accepted your loan offer."
        : "The borrower rejected your loan offer."

      await createNotification({
        userId: lenderUserId,
        actorId: input.userId,
        type: eventType,
        content: description,
        data: {
          loanRequestId: input.loanRequestId,
          borrowerId: input.userId,
          lenderId: lenderUserId,
          lenderName: offer.loan_helpers?.name || "A lender",
          amount: offer.amount,
          interestRate: offer.interest_rate,
          duration: offer.duration_months,
          durationUnit: (offer as any).duration_unit || "months",
          targetPath: `/loan-offers/${input.loanRequestId}`,
        },
      })

      await sendNotificationEmail({
        type: eventType,
        userId: lenderUserId,
        title,
        description,
        metadata: {
          lenderName: offer.loan_helpers?.name || "A lender",
          amount: offer.amount,
          interestRate: offer.interest_rate,
          duration: offer.duration_months,
          durationUnit: (offer as any).duration_unit || "months",
          purpose: offer.purpose,
          targetPath: "/loans",
        },
      })
    }

    revalidatePath("/loans")
    revalidatePath(`/loan-offers/${input.loanRequestId}`)

    return { success: true, status: nextStatus }
  } catch (error) {
    return { success: false, error }
  }
}
