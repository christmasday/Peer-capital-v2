"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { v4 as uuidv4 } from "uuid"
import { revalidatePath } from "next/cache"
import { createTransactionActivityNotification } from "./activity-notifications"

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
      return { error: "Failed to create transaction record" }
    }

    // Update the account balance
    const { data: accountData, error: accountError } = await adminClient
      .from("account_balances")
      .select("balance")
      .eq("user_id", userId)
      .single()

    if (accountError) {
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
      return { error: "Failed to update account balance" }
    }

    // Create activity notification
    try {
      await createTransactionActivityNotification({
        userId,
        amount: data.amount,
        type: "deposit",
        reference,
        description: `Account funded with ₦${data.amount.toLocaleString()} via ${data.paymentMethod}`,
      })
    } catch (notificationError) {
      // Non-blocking - continue even if notification fails
    }

    // Revalidate the account and home pages to reflect the new balance
    revalidatePath("/account/fund")
    revalidatePath("/home")
    revalidatePath("/profile")

    // Send transaction email notification
    try {
      const { data: userData, error: userError } = await adminClient
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", userId)
        .single()

      if (!userError && userData && userData.email) {
        const { sendTransactionEmail } = await import("@/lib/actions/email-notifications")
        await sendTransactionEmail({
          email: userData.email,
          userName: `${userData.first_name || ""} ${userData.last_name || ""}`.trim(),
          transactionType: "Account Funding",
          amount: data.amount,
          reference: reference,
          status: "completed",
        }).catch(() => {
          // Non-blocking - continue even if email fails
        })
      }
    } catch (emailError) {
      // Non-blocking - continue even if email fails
    }

    return {
      success: true,
      transactionId,
      reference,
      newBalance,
    }
  } catch (error) {
    return { error: "An unexpected error occurred. Please try again." }
  }
}

function generateShortUUIDv4(length = 20) {
  // Generate a v4 UUID and remove dashes, then trim to the desired length
  return uuidv4().replace(/-/g, "").slice(0, length)
}

export type TransferAccountData = {
  amount: number
  bankName: string
  accountNumber: string
  accountName: string
  recipientCode: string // Add this to support Paystack transfer
  reason?: string // Optional transfer reason
}

export async function transferFromAccount(data: TransferAccountData) {
  try {
    const supabase = createServerClient()
    const adminClient = createAdminClient()

    // Get the current user
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      return { error: "You must be logged in to transfer from your account" }
    }

    const userId = sessionData.session.user.id

    // Get the current account balance
    const { data: accountData, error: accountError } = await adminClient
      .from("account_balances")
      .select("balance")
      .eq("user_id", userId)
      .single()

    if (accountError) {
      return { error: "Failed to fetch account balance" }
    }

    const currentBalance = accountData?.balance || 0

    // Check if the user has sufficient balance
    if (currentBalance < data.amount) {
      return { error: "Insufficient balance for this transfer" }
    }

    // Generate a unique reference (20-char UUID v4)
    const reference = generateShortUUIDv4(20)

    // Call Paystack /transfer API
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
    if (!PAYSTACK_SECRET_KEY) {
      return { error: "Payment provider configuration error" }
    }
    const paystackRes = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: Math.round(data.amount * 100), // Paystack expects kobo
        recipient: data.recipientCode,
        reference,
        reason: data.reason || `Transfer to ${data.bankName} - ${data.accountNumber} (${data.accountName})`,
      }),
    })
    const paystackData = await paystackRes.json()
    if (!paystackData.status) {
      return { error: paystackData.message || "Failed to initiate transfer" }
    }

    // Create a transaction record (status: pending)
    const transactionId = uuidv4()
    const { error: transactionError } = await adminClient.from("transactions").insert({
      id: transactionId,
      user_id: userId,
      amount: data.amount,
      type: "transfer",
      description: data.reason || `Transfer to ${data.bankName} - ${data.accountNumber} (${data.accountName})`,
      reference: reference,
      status: "pending", // Will be updated by webhook
      created_at: new Date().toISOString(),
    })

    if (transactionError) {
      return { error: "Failed to create transaction record" }
    }

    // Do NOT update the account balance yet; wait for webhook

    // Create activity notification (optional)
    try {
      await createTransactionActivityNotification({
        userId,
        amount: -data.amount, // Negative amount for transfer
        type: "transfer",
        reference,
        description: `Transfer of ₦${data.amount.toLocaleString()} to ${data.bankName} - ${data.accountNumber}`,
      })
    } catch (notificationError) {
      // Non-blocking - continue even if notification fails
    }

    // Revalidate the account and home pages to reflect the new transaction
    revalidatePath("/account/transfer")
    revalidatePath("/home")
    revalidatePath("/profile")

    return {
      success: true,
      transactionId,
      reference,
      newBalance: currentBalance, // Not updated until webhook
      paystackTransfer: paystackData,
    }
  } catch (error) {
    return { error: "An unexpected error occurred. Please try again." }
  }
}
