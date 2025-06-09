"use server"

import { createNotification } from "./notifications"
import { getCurrentUserId } from "@/lib/auth-utils"

// Helper function to create activity notifications
export async function createActivityNotification({
  userId,
  type,
  title,
  content,
  data = {},
  referenceId,
}: {
  userId?: string
  type: string
  title: string
  content: string
  data?: any
  referenceId?: string
}) {
  try {
    // If userId is not provided, get the current user ID
    if (!userId) {
      userId = await getCurrentUserId()
      if (!userId) {
        return { success: false, error: "User ID is required" }
      }
    }

    // Create the notification
    const result = await createNotification({
      userId,
      type: type as any,
      content,
      data: {
        ...data,
        title,
      },
      ...(referenceId ? { referenceId } : {}),
    })

    return result
  } catch (error) {
    return { success: false, error }
  }
}

// Helper function to create transaction activity notification
export async function createTransactionActivityNotification({
  userId,
  amount,
  type,
  reference,
  description,
}: {
  userId: string
  amount: number
  type: "deposit" | "withdrawal" | "transfer"
  reference: string
  description?: string
}) {
  const isDeposit = type === "deposit"
  const title = isDeposit ? "Account Funded" : type === "withdrawal" ? "Withdrawal" : "Transfer"
  const content =
    description ||
    `${isDeposit ? "You received" : "You sent"} ₦${Math.abs(amount).toLocaleString()} ${
      isDeposit ? "in your account" : "from your account"
    }`

  return createActivityNotification({
    userId,
    type: isDeposit ? "deposit" : "withdrawal",
    title,
    content,
    data: {
      amount,
      reference,
      type,
    },
    referenceId: reference,
  })
}

// Helper function to create virtual account activity notification
export async function createVirtualAccountActivityNotification({
  userId,
  type,
  accountNumber,
  bankName,
  amount,
}: {
  userId: string
  type: "created" | "funded"
  accountNumber?: string
  bankName?: string
  amount?: number
}) {
  const isCreated = type === "created"
  const title = isCreated ? "Virtual Account Created" : "Virtual Account Funded"
  const content = isCreated
    ? `Your virtual account has been successfully created with ${bankName}`
    : `Your virtual account has been funded with ₦${amount?.toLocaleString()}`

  return createActivityNotification({
    userId,
    type: isCreated ? "virtual_account_created" : "virtual_account_funded",
    title,
    content,
    data: {
      accountNumber,
      bankName,
      amount,
      type,
    },
  })
}

// Helper function to create profile activity notification
export async function createProfileActivityNotification({
  userId,
  type,
  details,
}: {
  userId: string
  type: "updated" | "verified"
  details?: string
}) {
  const isUpdated = type === "updated"
  const title = isUpdated ? "Profile Updated" : "Profile Verified"
  const content =
    details || (isUpdated ? "Your profile information has been updated" : "Your profile has been verified")

  return createActivityNotification({
    userId,
    type: isUpdated ? "profile_updated" : "verification_completed",
    title,
    content,
    data: {
      type,
      details,
    },
  })
}

// Helper function to create account activity notification
export async function createAccountActivityNotification({
  userId,
  type,
  details,
}: {
  userId: string
  type: "created" | "security"
  details?: string
}) {
  const isCreated = type === "created"
  const title = isCreated ? "Account Created" : "Security Alert"
  const content =
    details ||
    (isCreated
      ? "Welcome to Peer Capital! Your account has been created successfully."
      : "There was a security event on your account")

  return createActivityNotification({
    userId,
    type: isCreated ? "account_created" : "security_alert",
    title,
    content,
    data: {
      type,
      details,
    },
  })
}
