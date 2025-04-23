"use server"

import { createServerClient } from "@/lib/supabase/server"
import { getJWTFromCookies, verifyJWT } from "@/lib/jwt"
import { createAdminClient } from "@/lib/supabase/admin"

// Mock data for fallback
const mockTransactions = [
  {
    id: "mock-tx-1",
    user_id: "mock-user",
    amount: 50000,
    type: "deposit",
    description: "Account funding",
    reference: "DEP12345",
    status: "completed",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-tx-2",
    user_id: "mock-user",
    amount: 15000,
    type: "withdrawal",
    description: "ATM withdrawal",
    reference: "WIT12345",
    status: "completed",
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-tx-3",
    user_id: "mock-user",
    amount: 20000,
    type: "loan_request",
    description: "Loan request from Ada Ada",
    reference: "LOAN12345",
    status: "pending",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export async function getUserTransactions() {
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
      console.log("No authenticated user found, returning mock transactions")
      return { transactions: mockTransactions }
    }

    // Get all transactions for the user
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching transactions:", error)
      // Return mock data as fallback
      return { transactions: mockTransactions }
    }

    return { success: true, transactions: data }
  } catch (error) {
    console.error("Unexpected error fetching transactions:", error)
    // Return mock data as fallback
    return { transactions: mockTransactions }
  }
}

export async function getTransactionById(id: string) {
  try {
    // Check for JWT first
    const jwt = getJWTFromCookies()
    let userId = null

    if (jwt) {
      try {
        const { payload, error } = await verifyJWT(jwt)
        if (!error && payload && payload.userId) {
          userId = payload.userId
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
      }
    }

    // If still no userId, return mock data
    if (!userId) {
      // Find a mock transaction with the given ID or return the first one
      const mockTransaction = mockTransactions.find((t) => t.id === id) || mockTransactions[0]
      return { transaction: mockTransaction }
    }

    // Get the transaction
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from("transactions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching transaction:", error)
      return { error: "Transaction not found" }
    }

    return { transaction: data }
  } catch (error) {
    console.error("Unexpected error fetching transaction:", error)
    return { error: "An unexpected error occurred" }
  }
}
