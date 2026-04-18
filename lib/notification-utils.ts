import { NotificationEvent } from "./notification-service"

/**
 * Send a notification for account activity
 * This function can be called from anywhere in the application
 */
export async function sendAccountNotification(event: NotificationEvent): Promise<boolean> {
  try {
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    })

    if (response.ok) {
      const result = await response.json()
      return result.sent
    }

    return false
  } catch (error) {
    console.error("Error sending notification:", error)
    return false
  }
}

/**
 * Helper functions for common notification types
 */
export const notificationHelpers = {
  // Account activity notifications
  login: (userId: string, metadata?: Record<string, any>) =>
    sendAccountNotification({
      type: 'login',
      userId,
      title: 'New Login Detected',
      description: 'We detected a new login to your PeerCapital account.',
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    }),

  passwordChange: (userId: string, metadata?: Record<string, any>) =>
    sendAccountNotification({
      type: 'password_change',
      userId,
      title: 'Password Changed Successfully',
      description: 'Your PeerCapital account password has been successfully changed.',
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    }),

  // Transaction notifications
  accountFunding: (userId: string, amount: string, metadata?: Record<string, any>) =>
    sendAccountNotification({
      type: 'account_funding',
      userId,
      title: 'Account Funded',
      description: `Your account has been funded with ${amount}.`,
      metadata: {
        amount,
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    }),

  withdrawal: (userId: string, amount: string, metadata?: Record<string, any>) =>
    sendAccountNotification({
      type: 'withdrawal',
      userId,
      title: 'Withdrawal Processed',
      description: `A withdrawal of ${amount} has been processed from your account.`,
      metadata: {
        amount,
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    }),

  // Loan notifications
  loanRequest: (userId: string, amount: string, metadata?: Record<string, any>) =>
    sendAccountNotification({
      type: 'loan_request',
      userId,
      title: 'Loan Request Submitted',
      description: `Your loan request for ${amount} has been submitted successfully.`,
      metadata: {
        amount,
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    }),

  loanRepayment: (userId: string, amount: string, metadata?: Record<string, any>) =>
    sendAccountNotification({
      type: 'loan_repayment',
      userId,
      title: 'Loan Repayment Received',
      description: `A loan repayment of ${amount} has been received.`,
      metadata: {
        amount,
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    }),

  // Verification notifications
  verification: (userId: string, status: string, metadata?: Record<string, any>) =>
    sendAccountNotification({
      type: 'verification',
      userId,
      title: 'Verification Status Updated',
      description: `Your verification status has been updated to: ${status}.`,
      metadata: {
        status,
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    }),

  // Security notifications
  securityAlert: (userId: string, alert: string, metadata?: Record<string, any>) =>
    sendAccountNotification({
      type: 'security_alert',
      userId,
      title: 'Security Alert',
      description: alert,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    }),
}
