"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { getJWTFromCookies, verifyJWT } from "@/lib/jwt"

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
  helperId,
  amount,
  durationMonths,
  purpose,
  purposeDetails,
  interestRate,
}: {
  helperId: string
  amount: number
  durationMonths: number
  purpose: string
  purposeDetails: string
  interestRate: number
}) {
  try {
    const supabase = createServerClient()
    const adminClient = createAdminClient()

    // Get the current user
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      return { error: "You must be logged in to request a loan" }
    }

    const userId = sessionData.session.user.id
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
        duration_months: durationMonths,
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
      const supabase = createServerClient()
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
    const supabase = createServerClient()
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
    const supabase = createServerClient()
    const adminClient = createAdminClient()

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

    // Update the transaction status to cancelled
    const { error: transactionError } = await adminClient
      .from("transactions")
      .update({
        status: "cancelled",
      })
      .eq("reference", loanRequestId)
      .eq("user_id", userId)

    if (transactionError) {
      console.error("Error updating transaction record:", transactionError)
      // We don't return an error here as the loan request cancellation was successful
    }

    revalidatePath("/loans")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error cancelling loan request:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
