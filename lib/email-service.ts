import { Resend } from "resend"

// Initialize Resend with the API key
const resend = new Resend(process.env.RESEND_API_KEY)

// Default sender email
const DEFAULT_FROM_EMAIL = "PeerCapital <noreply@peercapital.com.ng>"

/**
 * Send an email using Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = DEFAULT_FROM_EMAIL,
}: {
  to: string | string[]
  subject: string
  html: string
  from?: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    if (error) {
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending email",
    }
  }
}

/**
 * Email templates
 */

// Password reset email template
export function getPasswordResetEmailTemplate(resetUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0f172a; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">PeerCapital</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #0f172a; margin-top: 0;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>If you didn't request this password reset, you can safely ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The PeerCapital Team</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">If the button doesn't work, copy and paste this URL into your browser: ${resetUrl}</p>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>&copy; ${new Date().getFullYear()} PeerCapital. All rights reserved.</p>
        <p>Plot 123, Example Street, Lagos, Nigeria</p>
      </div>
    </div>
  `
}

// Welcome email template
export function getWelcomeEmailTemplate(userName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0f172a; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">PeerCapital</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #0f172a; margin-top: 0;">Welcome to PeerCapital!</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for joining PeerCapital. We're excited to have you on board!</p>
        <p>With your new account, you can:</p>
        <ul>
          <li>Request loans from trusted lenders</li>
          <li>Build your credit profile</li>
          <li>Manage your finances securely</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://peercapital.com.ng"}/home" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Dashboard</a>
        </div>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The PeerCapital Team</p>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>&copy; ${new Date().getFullYear()} PeerCapital. All rights reserved.</p>
        <p>Plot 123, Example Street, Lagos, Nigeria</p>
      </div>
    </div>
  `
}

// Transaction notification email template
export function getTransactionEmailTemplate({
  userName,
  transactionType,
  amount,
  date,
  reference,
  status,
}: {
  userName: string
  transactionType: string
  amount: string
  date: string
  reference: string
  status: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0f172a; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">PeerCapital</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #0f172a; margin-top: 0;">Transaction Notification</h2>
        <p>Hello ${userName},</p>
        <p>This is to notify you of a recent transaction on your PeerCapital account:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 15px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Transaction Type:</strong> ${transactionType}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0;"><strong>Reference:</strong> ${reference}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${
            status.toLowerCase() === "completed"
              ? "#16a34a"
              : status.toLowerCase() === "pending"
                ? "#ca8a04"
                : status.toLowerCase() === "failed"
                  ? "#dc2626"
                  : "#6b7280"
          };">${status}</span></p>
        </div>
        
        <p>If you did not authorize this transaction, please contact our support team immediately.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://peercapital.com.ng"}/transactions" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Transaction Details</a>
        </div>
        
        <p>Best regards,<br>The PeerCapital Team</p>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>&copy; ${new Date().getFullYear()} PeerCapital. All rights reserved.</p>
        <p>Plot 123, Example Street, Lagos, Nigeria</p>
      </div>
    </div>
  `
}
