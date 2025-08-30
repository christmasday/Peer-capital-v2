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
        <p>Lagos, Nigeria</p>
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
        <p>Lagos, Nigeria</p>
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
        <p>Lagos, Nigeria</p>
      </div>
    </div>
  `
}

// Account activity notification email template
export function getAccountActivityEmailTemplate({
  userName,
  eventTitle,
  eventDescription,
  eventType,
  metadata,
  isLoggedIn = false,
}: {
  userName: string
  eventTitle: string
  eventDescription: string
  eventType: string
  metadata?: Record<string, any>
  isLoggedIn?: boolean
}): string {
  // Get appropriate icon and color based on event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login':
        return '🔐'
      case 'logout':
        return '🚪'
      case 'password_change':
        return '🔑'
      case 'account_funding':
        return '💰'
      case 'withdrawal':
        return '💸'
      case 'loan_request':
        return '📋'
      case 'loan_repayment':
        return '✅'
      case 'verification':
        return '✅'
      case 'security_alert':
        return '⚠️'
      default:
        return '📢'
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'login':
      case 'logout':
        return '#3b82f6'
      case 'password_change':
      case 'security_alert':
        return '#ef4444'
      case 'account_funding':
      case 'withdrawal':
        return '#10b981'
      case 'loan_request':
      case 'loan_repayment':
        return '#8b5cf6'
      case 'verification':
        return '#f59e0b'
      default:
        return '#6b7280'
    }
  }

  const eventIcon = getEventIcon(eventType)
  const eventColor = getEventColor(eventType)

  // Format metadata for display
  const formatMetadata = (meta?: Record<string, any>) => {
    if (!meta) return ''
    
    return Object.entries(meta)
      .map(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        return `<p style="margin: 5px 0;"><strong>${formattedKey}:</strong> ${value}</p>`
      })
      .join('')
  }

  // Customize content based on login status
  const getSecurityNotice = () => {
    if (isLoggedIn) {
      return `
        <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 4px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            <strong>Account Activity:</strong> This notification was sent because you have email notifications enabled for this type of activity. 
            You are currently logged into your account.
          </p>
        </div>
      `
    } else {
      return `
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Security Notice:</strong> This notification was sent because you were not logged into your account when this activity occurred. 
            If you don't recognize this activity, please contact our support team immediately.
          </p>
        </div>
      `
    }
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0f172a; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">PeerCapital</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 48px; margin-bottom: 10px;">${eventIcon}</div>
          <h2 style="color: #0f172a; margin: 0;">${eventTitle}</h2>
        </div>
        
        <p>Hello ${userName},</p>
        <p>${eventDescription}</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 15px; margin: 20px 0; border-left: 4px solid ${eventColor};">
          <p style="margin: 5px 0;"><strong>Event Type:</strong> ${eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${isLoggedIn ? 'Logged In' : 'Not Logged In'}</p>
          ${formatMetadata(metadata)}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://peercapital.com.ng"}/dashboard" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Account</a>
        </div>
        
        ${getSecurityNotice()}
        
        <p>Best regards,<br>The PeerCapital Team</p>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>&copy; ${new Date().getFullYear()} PeerCapital. All rights reserved.</p>
        <p>Lagos, Nigeria</p>
      </div>
    </div>
  `
}
