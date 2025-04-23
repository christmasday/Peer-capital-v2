"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { v4 as uuidv4 } from "uuid"
import { revalidatePath } from "next/cache"

export type FundAccountData = {
  amount: number
  paymentMethod: string
  reference?: string
}

export async function fundAccount(data: FundAccountData) {
  try {
    const supabase = createServerClient()
    const adminClient = createAdminClient()

    // Get the current user
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      return { error: "You must be logged in to fund your account" }
    }

    const userId = sessionData.session.user.id

    // Generate a unique reference if not provided
    const reference = data.reference || `FND${Date.now().toString().substring(7)}${Math.floor(Math.random() * 1000)}`

    // Create a transaction record
    const transactionId = uuidv4()
    const { error: transactionError } = await adminClient.from("transactions").insert({
      id: transactionId,
      user_id: userId,
      amount: data.amount,
      type: "deposit",
      description: `Account funding via ${data.paymentMethod}`,
      reference: reference,
      status: "completed", // In a real app, this might be "pending" until payment confirmation
      created_at: new Date().toISOString(),
    })

    if (transactionError) {
      console.error("Error creating transaction record:", transactionError)
      return { error: "Failed to create transaction record" }
    }

    // Update the account balance
    const { data: accountData, error: accountError } = await adminClient
      .from("account_balances")
      .select("balance")
      .eq("user_id", userId)
      .single()

    if (accountError) {
      console.error("Error fetching account balance:", accountError)
      return { error: "Failed to fetch account balance" }
    }

    const currentBalance = accountData?.balance || 0
    const newBalance = currentBalance + data.amount

    const { error: updateError } = await adminClient
      .from("account_balances")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (updateError) {
      console.error("Error updating account balance:", updateError)
      return { error: "Failed to update account balance" }
    }

    // Revalidate the account and home pages to reflect the new balance
    revalidatePath("/account/fund")
    revalidatePath("/home")
    revalidatePath("/profile")

    return {
      success: true,
      transactionId,
      reference,
      newBalance,
    }
  } catch (error) {
    console.error("Unexpected error funding account:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export type WithdrawAccountData = {
  amount: number
  bankName: string
  accountNumber: string
  accountName: string
}

export async function withdrawFromAccount(data: WithdrawAccountData) {
  try {
    const supabase = createServerClient()
    const adminClient = createAdminClient()

    // Get the current user
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      return { error: "You must be logged in to withdraw from your account" }
    }

    const userId = sessionData.session.user.id

    // Get the current account balance
    const { data: accountData, error: accountError } = await adminClient
      .from("account_balances")
      .select("balance")
      .eq("user_id", userId)
      .single()

    if (accountError) {
      console.error("Error fetching account balance:", accountError)
      return { error: "Failed to fetch account balance" }
    }

    const currentBalance = accountData?.balance || 0

    // Check if the user has sufficient balance
    if (currentBalance < data.amount) {
      return { error: "Insufficient balance for this withdrawal" }
    }

    // Generate a unique reference
    const reference = `WTH${Date.now().toString().substring(7)}${Math.floor(Math.random() * 1000)}`

    // Create a transaction record
    const transactionId = uuidv4()
    const { error: transactionError } = await adminClient.from("transactions").insert({
      id: transactionId,
      user_id: userId,
      amount: data.amount,
      type: "withdrawal",
      description: `Withdrawal to ${data.bankName} - ${data.accountNumber} (${data.accountName})`,
      reference: reference,
      status: "pending", // In a real app, this would be updated when the withdrawal is processed
      created_at: new Date().toISOString(),
    })

    if (transactionError) {
      console.error("Error creating transaction record:", transactionError)
      return { error: "Failed to create transaction record" }
    }

    // Update the account balance
    const newBalance = currentBalance - data.amount

    const { error: updateError } = await adminClient
      .from("account_balances")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (updateError) {
      console.error("Error updating account balance:", updateError)
      return { error: "Failed to update account balance" }
    }

    // Revalidate the account and home pages to reflect the new balance
    revalidatePath("/account/withdraw")
    revalidatePath("/home")
    revalidatePath("/profile")

    return {
      success: true,
      transactionId,
      reference,
      newBalance,
    }
  } catch (error) {
    console.error("Unexpected error withdrawing from account:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
