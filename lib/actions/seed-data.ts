"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { v4 as uuidv4 } from "uuid"

export async function seedTransactionData(userId: string) {
  try {
    const supabaseAdmin = createAdminClient()

    // Check if user already has transactions
    const { data: existingTransactions } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .limit(1)

    if (existingTransactions && existingTransactions.length > 0) {
      return { success: true, message: "User already has transactions" }
    }

    // Sample transactions
    const transactions = [
      {
        id: uuidv4(),
        user_id: userId,
        amount: 50000,
        type: "deposit",
        description: "Account funding",
        reference: "DEP" + Date.now().toString().substring(7),
        status: "completed",
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      },
      {
        id: uuidv4(),
        user_id: userId,
        amount: 15000,
        type: "withdrawal",
        description: "ATM withdrawal",
        reference: "WIT" + Date.now().toString().substring(7),
        status: "completed",
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
      },
      {
        id: uuidv4(),
        user_id: userId,
        amount: 20000,
        type: "loan_request",
        description: "Loan request from Ada Ada",
        reference: uuidv4(),
        status: "pending",
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      },
      {
        id: uuidv4(),
        user_id: userId,
        amount: 10000,
        type: "transfer",
        description: "Transfer to John Doe",
        reference: "TRF" + Date.now().toString().substring(7),
        status: "completed",
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      },
      {
        id: uuidv4(),
        user_id: userId,
        amount: 5000,
        type: "loan_repayment",
        description: "Loan repayment to Don Halbert",
        reference: "REP" + Date.now().toString().substring(7),
        status: "completed",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      },
    ]

    // Insert transactions
    const { error } = await supabaseAdmin.from("transactions").insert(transactions)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function seedLoanRequestData(userId: string) {
  try {
    const supabaseAdmin = createAdminClient()

    // Check if user already has loan requests
    const { data: existingRequests } = await supabaseAdmin
      .from("loan_requests")
      .select("id")
      .eq("user_id", userId)
      .limit(1)

    if (existingRequests && existingRequests.length > 0) {
      return { success: true, message: "User already has loan requests" }
    }

    // Get helper IDs
    const { data: helpers } = await supabaseAdmin.from("loan_helpers").select("id").limit(2)

    if (!helpers || helpers.length === 0) {
      return { error: "No loan helpers found" }
    }

    // Sample loan requests
    const loanRequests = [
      {
        id: uuidv4(),
        user_id: userId,
        helper_id: helpers[0].id,
        amount: 20000,
        interest_rate: 0.2,
        duration_months: 6,
        status: "pending",
        purpose: "business: Starting a small online business",
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: uuidv4(),
        user_id: userId,
        helper_id: helpers.length > 1 ? helpers[1].id : helpers[0].id,
        amount: 50000,
        interest_rate: 0.4,
        duration_months: 12,
        status: "approved",
        purpose: "education: Paying for professional certification",
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        updated_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), // 28 days ago
      },
    ]

    // Insert loan requests
    const { error } = await supabaseAdmin.from("loan_requests").insert(loanRequests)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: "An unexpected error occurred. Please try again." }
  }
}
