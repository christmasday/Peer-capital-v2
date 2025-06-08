"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient, isOfflineMode } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { getJWTFromCookies, verifyJWT } from "@/lib/jwt"
import fetch from 'node-fetch'
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { createNotification } from "@/lib/actions/notifications"

// Mock data for fallback
const mockLoanRequests = [
  {
    id: "mock-loan-1",
    user_id: "mock-user",
    helper_id: "mock-helper-1",
    amount: 20000,
    interest_rate: 0.2,
    duration_months: 6,
    status: "pending",
    purpose: "business: Starting a small online business",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    loan_helpers: {
      name: "Ada Ada",
      profile_image_url: "/vibrant-street-market.png",
    },
  },
  {
    id: "mock-loan-2",
    user_id: "mock-user",
    helper_id: "mock-helper-2",
    amount: 50000,
    interest_rate: 0.4,
    duration_months: 12,
    status: "approved",
    purpose: "education: Paying for professional certification",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    loan_helpers: {
      name: "Don Halbert",
      profile_image_url: "/vibrant-street-market.png",
    },
  },
]

export async function createLoanRequest({
  userId,
  helperId,
  amount,
  duration,
  durationUnit,
  purpose,
  purposeDetails,
  interestRate,
}: {
  userId: string
  helperId: string
  amount: number
  duration: number
  durationUnit: string
  purpose: string
  purposeDetails: string
  interestRate: number
}) {
  try {
    const supabase = createServerClient() as SupabaseClient<Database>
    const adminClient = createAdminClient() as SupabaseClient<Database>

    // Fetch borrower's profile for validation
    const { data: borrowerProfile, error: borrowerProfileError } = await supabase
      .from("profiles")
      .select("first_name, last_name, phone_number, address, city, state, bank_name, account_number, bvn, date_of_birth")
      .eq("id", userId)
      .maybeSingle()
    if (borrowerProfileError) {
      return { error: "Could not fetch your profile. Please try again." }
    }
   // const isProfileComplete = borrowerProfile && borrowerProfile.first_name && borrowerProfile.last_name && borrowerProfile.phone_number && borrowerProfile.address && borrowerProfile.city && borrowerProfile.state && borrowerProfile.bank_name && borrowerProfile.account_number && borrowerProfile.bvn && borrowerProfile.date_of_birth
   // if (!isProfileComplete) {
   //   return { error: "You must complete your profile before requesting a loan." }
   // }

    const loanId = uuidv4()

    // Create the loan request using admin client
    const { data, error } = await adminClient
      .from("loan_requests")
      .insert({
        id: loanId,
        user_id: userId,
        helper_id: helperId,
        amount: amount,
        interest_rate: interestRate,
        duration_months: duration,
        duration_unit: durationUnit,
        status: "pending",
        purpose: `${purpose}: ${purposeDetails}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error creating loan request:", error)
      return { error: error.message }
    }

    // Notify the helper (lender) of the new loan request
    await createNotification({
      userId: helperId, // the lender
      actorId: userId, // the borrower
      type: "loan_request",
      data: {
        loanRequestId: loanId,
        amount,
        interestRate,
        duration,
        durationUnit,
        purpose,
        purposeDetails,
      },
    })

    // Insert into loan_history
    await adminClient.from("loan_history").insert({
      loan_request_id: loanId,
      lender_id: helperId,
      borrower_id: userId,
      amount: amount,
      interest_rate: interestRate,
      duration: duration,
      duration_unit: durationUnit,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    // Create a transaction record for the loan request
    const { error: transactionError } = await adminClient.from("transactions").insert({
      id: uuidv4(),
      user_id: userId,
      amount: amount,
      type: "loan_request",
      description: `Loan request for ${amount} with ${interestRate}% interest rate`,
      reference: loanId,
      status: "pending",
      created_at: new Date().toISOString(),
    })

    if (transactionError) {
      console.error("Error creating transaction record:", transactionError)
      // We don't return an error here as the loan request was successful
    }

    revalidatePath("/loans")
    return { success: true, loanRequest: data[0] }
  } catch (error) {
    console.error("Unexpected error creating loan request:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function getUserLoanRequests() {
  try {
    // Check for JWT first
    const jwt = getJWTFromCookies()
    let userId = null

    if (jwt) {
      try {
        const { payload, error } = await verifyJWT(jwt)
        if (!error && payload && payload.userId) {
          userId = payload.userId
          console.log("Using userId from JWT:", userId)
        }
      } catch (error) {
        console.error("Error verifying JWT:", error)
      }
    }

    // If no userId from JWT, try Supabase session
    if (!userId) {
      const supabase = createServerClient() as SupabaseClient<Database>
      const { data: sessionData } = await supabase.auth.getSession()

      if (sessionData.session?.user) {
        userId = sessionData.session.user.id
        console.log("Using userId from Supabase session:", userId)
      }
    }

    // If still no userId, return mock data
    if (!userId) {
      console.log("No authenticated user found, returning mock loan requests")
      return { loanRequests: mockLoanRequests }
    }

    // Get all loan requests for the user
    const supabase = createServerClient() as SupabaseClient<Database>
    const { data, error } = await supabase
      .from("loan_requests")
      .select(`
        *,
        loan_helpers (
          name,
          profile_image_url
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching loan requests:", error)
      // Return mock data as fallback
      return { loanRequests: mockLoanRequests }
    }

    return { success: true, loanRequests: data }
  } catch (error) {
    console.error("Unexpected error fetching loan requests:", error)
    // Return mock data as fallback
    return { loanRequests: mockLoanRequests }
  }
}

export async function cancelLoanRequest(loanRequestId: string) {
  try {
    const supabase = createServerClient() as SupabaseClient<Database>
    const adminClient = createAdminClient() as SupabaseClient<Database>

    // Get the current user
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      return { error: "You must be logged in to cancel a loan request" }
    }

    const userId = sessionData.session.user.id

    // Update the loan request status to cancelled using admin client
    const { data, error } = await adminClient
      .from("loan_requests")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", loanRequestId)
      .eq("user_id", userId) // Ensure the user owns this loan request
      .select()

    if (error) {
      console.error("Error cancelling loan request:", error)
      return { error: error.message }
    }

    if (data.length === 0) {
      return { error: "Loan request not found or you don't have permission to cancel it" }
    }

    // Fetch the full loan request to get all fields for loan_history
    const { data: cancelledLoan, error: fetchCancelledError } = await adminClient
      .from("loan_requests")
      .select("id, helper_id, user_id, amount, interest_rate, duration_months, duration_unit")
      .eq("id", loanRequestId)
      .single()
    if (fetchCancelledError || !cancelledLoan) {
      console.error("Error fetching cancelled loan request for loan_history:", fetchCancelledError)
      return { error: "Failed to fetch cancelled loan request details" }
    }

    // Insert into loan_history for cancellation
    await adminClient.from("loan_history").insert({
      loan_request_id: loanRequestId,
      lender_id: cancelledLoan.helper_id,
      borrower_id: cancelledLoan.user_id,
      amount: cancelledLoan.amount,
      interest_rate: cancelledLoan.interest_rate,
      duration: cancelledLoan.duration_months,
      duration_unit: cancelledLoan.duration_unit,
      status: "cancelled",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    revalidatePath("/loans")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error cancelling loan request:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function getAllLoanRequests() {
  try {
    const adminClient = createAdminClient() as SupabaseClient<Database>
    const { data, error } = await adminClient
      .from("loan_requests")
      .select(`*, loan_helpers (name, profile_image_url)`)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching all loan requests:", error);
      return { loanRequests: [] };
    }
    return { success: true, loanRequests: data };
  } catch (error) {
    console.error("Unexpected error fetching all loan requests:", error);
    return { loanRequests: [] };
  }
}

/**
 * Approve a loan request: validate pin, transfer funds, update status
 */
export async function approveLoanRequest({ loanRequestId, pin, approverId }: { loanRequestId: string, pin: string, approverId: string }) {
  if (!pin || pin.length !== 6) {
    return { success: false, error: "Invalid pin" }
  }
  const adminClient = createAdminClient() as SupabaseClient<Database>
  const { data: loanRequest, error: loanError } = await adminClient
    .from("loan_requests")
    .select("id, user_id, amount, duration_months, duration_unit, interest_rate, purpose, status, helper_id")
    .eq("id", loanRequestId)
    .single()
  if (loanError || !loanRequest) {
    return { success: false, error: "Loan request not found" }
  }
  // Fetch approver (helper) and requester profiles for virtual account details
  const { data: helperProfile } = await adminClient
    .from("profiles")
    .select("id, first_name, last_name, bank_name, account_number")
    .eq("id", approverId)
    .single()
  const { data: requesterProfile } = await adminClient
    .from("profiles")
    .select("id, first_name, last_name, bank_name, account_number")
    .eq("id", loanRequest.user_id)
    .single()
  if (!helperProfile || !requesterProfile) {
    return { success: false, error: "Could not fetch user bank details" }
  }
  // Calculate fees (placeholder)
  const fee = Math.ceil(loanRequest.amount * 0.01)
  const total = loanRequest.amount + fee
  // 1. Register recipient with Paystack (if not already)
  const paystackKey = process.env.PAYSTACK_SECRET_KEY
  if (!paystackKey) {
    return { success: false, error: "Paystack secret key not configured" }
  }
  // Create transfer recipient for requester
  const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name: `${requesterProfile.first_name} ${requesterProfile.last_name}`,
      account_number: requesterProfile.account_number,
      bank_code: requesterProfile.bank_name, // This should be the bank code, not name
      currency: "NGN",
    }),
  })
  const recipientData = await recipientRes.json() as any
  if (!recipientData.status || !recipientData.data?.recipient_code) {
    return { success: false, error: recipientData.message || "Failed to create transfer recipient" }
  }
  // 2. Initiate transfer
  const transferRes = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: loanRequest.amount * 100, // Paystack expects kobo
      recipient: recipientData.data.recipient_code,
      reason: `Peer Capital loan transfer for request ${loanRequestId}`,
    }),
  })
  const transferData = await transferRes.json() as any
  if (!transferData.status) {
    return { success: false, error: transferData.message || "Paystack transfer failed" }
  }
  // 3. Update loan request status
  const { error: updateError } = await adminClient
    .from("loan_requests")
    .update({ status: "approved" })
    .eq("id", loanRequestId)
  if (updateError) {
    return { success: false, error: "Failed to update loan status" }
  }
  // Insert into loan_history for approval
  await adminClient.from("loan_history").insert({
    loan_request_id: loanRequestId,
    lender_id: approverId,
    borrower_id: loanRequest.user_id,
    amount: loanRequest.amount,
    interest_rate: loanRequest.interest_rate,
    duration: loanRequest.duration_months,
    duration_unit: loanRequest.duration_unit,
    status: "approved",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  // 4. Create notification for requester
  await adminClient.from("notifications").insert({
    user_id: loanRequest.user_id,
    actor_id: approverId,
    type: "loan_approved",
    content: `Your loan request has been approved and funds transferred.`,
    data: { message: `Your loan request has been approved and funds transferred.`, loanRequestId },
    reference_id: loanRequestId,
    read: false,
    created_at: new Date().toISOString(),
  })
  // Also trigger notification via createNotification
  await createNotification({
    userId: loanRequest.user_id,
    actorId: approverId,
    type: "loan_approved",
    data: {
      loanRequestId,
      amount: loanRequest.amount,
      interestRate: loanRequest.interest_rate,
      duration: loanRequest.duration_months,
      durationUnit: loanRequest.duration_unit,
      helperId: approverId,
    },
  })
  return { success: true }
}

/**
 * Reject a loan request: update status to 'rejected'
 */
export async function rejectLoanRequest({ loanRequestId, approverId }: { loanRequestId: string, approverId: string }) {
  try {
    const adminClient = createAdminClient() as SupabaseClient<Database>
    // Optionally, check that the approver is the helper for this request
    const { data: loanRequest, error: fetchError } = await adminClient
      .from("loan_requests")
      .select("id, helper_id, user_id, amount, interest_rate, duration_months, duration_unit")
      .eq("id", loanRequestId)
      .single()
    if (fetchError || !loanRequest) {
      return { success: false, error: "Loan request not found" }
    }
    if (loanRequest.helper_id !== approverId) {
      return { success: false, error: "You are not authorized to reject this request" }
    }
    const { error } = await adminClient
      .from("loan_requests")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", loanRequestId)
    if (error) {
      return { success: false, error: error.message || "Failed to reject loan request" }
    }
    // Insert into loan_history for rejection
    await adminClient.from("loan_history").insert({
      loan_request_id: loanRequestId,
      lender_id: loanRequest.helper_id,
      borrower_id: loanRequest.user_id,
      amount: loanRequest.amount,
      interest_rate: loanRequest.interest_rate,
      duration: loanRequest.duration_months,
      duration_unit: loanRequest.duration_unit,
      status: "rejected",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    // Create notification for requester
    await adminClient.from("notifications").insert({
      user_id: loanRequest.user_id,
      actor_id: approverId,
      type: "loan_rejected",
      content: `Your loan request was rejected.`,
      data: { message: `Your loan request was rejected.`, loanRequestId },
      reference_id: loanRequestId,
      read: false,
      created_at: new Date().toISOString(),
    })
    // Also trigger notification via createNotification
    await createNotification({
      userId: loanRequest.user_id,
      actorId: approverId,
      type: "loan_rejected",
      data: {
        loanRequestId,
        amount: loanRequest.amount,
        interestRate: loanRequest.interest_rate,
        duration: loanRequest.duration_months,
        durationUnit: loanRequest.duration_unit,
        helperId: approverId,
      },
    })
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || "Unexpected error" }
  }
}
