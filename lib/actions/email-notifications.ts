"use server"

import { sendEmail, getWelcomeEmailTemplate, getTransactionEmailTemplate } from "@/lib/email-service"

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(email: string, userName: string) {
  try {
    console.log(`Sending welcome email to ${email}`)

    const result = await sendEmail({
      to: email,
      subject: "Welcome to PeerCapital!",
      html: getWelcomeEmailTemplate(userName),
    })

    if (!result.success) {
      console.error("Failed to send welcome email:", result.error)
      return { success: false, error: result.error }
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error sending welcome email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending welcome email",
    }
  }
}

/**
 * Send a transaction notification email
 */
export async function sendTransactionEmail({
  email,
  userName,
  transactionType,
  amount,
  reference,
  status,
}: {
  email: string
  userName: string
  transactionType: string
  amount: number
  reference: string
  status: string
}) {
  try {
    console.log(`Sending transaction email to ${email}`)

    // Format the amount as currency
    const formattedAmount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)

    // Format the date
    const formattedDate = new Date().toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    })

    const result = await sendEmail({
      to: email,
      subject: `PeerCapital Transaction: ${transactionType}`,
      html: getTransactionEmailTemplate({
        userName,
        transactionType,
        amount: formattedAmount,
        date: formattedDate,
        reference,
        status,
      }),
    })

    if (!result.success) {
      console.error("Failed to send transaction email:", result.error)
      return { success: false, error: result.error }
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error sending transaction email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending transaction email",
    }
  }
}
