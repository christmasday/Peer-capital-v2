import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail, getAccountActivityEmailTemplate } from "@/lib/email-service"
import { cookies } from "next/headers"

export interface NotificationEvent {
  type: 'login' | 'password_change' | 'account_funding' | 'withdrawal' | 'loan_request' | 'loan_repayment' | 'verification' | 'security_alert'
  userId: string
  title: string
  description: string
  metadata?: Record<string, any>
}

/**
 * Check if a user has an active session
 */
export async function isUserLoggedIn(userId: string): Promise<boolean> {
  try {
    const adminClient = createAdminClient()
    
    const { data: activeSessions, error } = await adminClient
      .from("user_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gte("expires_at", new Date().toISOString())
      .limit(1)

    if (error) {
      console.error("Error checking user session:", error)
      return false
    }

    return activeSessions && activeSessions.length > 0
  } catch (error) {
    console.error("Error checking user session:", error)
    return false
  }
}

/**
 * Get user notification preferences
 */
export async function getUserNotificationPreferences(userId: string) {
  try {
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching notification preferences:", error)
      return null
    }

    // Return default preferences if none found
    if (!data) {
      return {
        email_notifications: true,
        sms_notifications: true,
        push_notifications: true,
        marketing_emails: false,
        transaction_alerts: true,
        security_alerts: true,
        transaction_activity: true,
        loan_activity: true,
        connection_activity: true,
        message_activity: true,
        verification_activity: true,
        account_activity: true,
        system_activity: true,
      }
    }

    return data
  } catch (error) {
    console.error("Error fetching notification preferences:", error)
    return null
  }
}

/**
 * Get user profile information
 */
export async function getUserProfile(userId: string) {
  try {
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

/**
 * Send notification email to user if they have email notifications enabled
 */
export async function sendNotificationEmail(event: NotificationEvent): Promise<boolean> {
  try {
    // Get user notification preferences
    const preferences = await getUserNotificationPreferences(event.userId)
    if (!preferences || !preferences.email_notifications) {
      console.log(`User ${event.userId} has email notifications disabled`)
      return false
    }

    // Check if this specific activity type is enabled
    const activityTypeMap: Record<string, keyof typeof preferences> = {
      'login': 'account_activity',
      'password_change': 'security_alerts',
      'account_funding': 'transaction_activity',
      'withdrawal': 'transaction_activity',
      'loan_request': 'loan_activity',
      'loan_repayment': 'loan_activity',
      'verification': 'verification_activity',
      'security_alert': 'security_alerts',
    }

    const activityType = activityTypeMap[event.type]
    if (activityType && !preferences[activityType as keyof typeof preferences]) {
      console.log(`User ${event.userId} has ${String(activityType)} notifications disabled`)
      return false
    }

    // Get user profile for email
    const profile = await getUserProfile(event.userId)
    if (!profile || !profile.email) {
      console.error(`No email found for user ${event.userId}`)
      return false
    }

    // Check if user is logged in to customize email content
    const isLoggedIn = await isUserLoggedIn(event.userId)

    // Generate email content
    const emailHtml = getAccountActivityEmailTemplate({
      userName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
      eventTitle: event.title,
      eventDescription: event.description,
      eventType: event.type,
      metadata: event.metadata,
      isLoggedIn,
    })

    // Send email
    const result = await sendEmail({
      to: profile.email,
      subject: `PeerCapital - ${event.title}`,
      html: emailHtml,
    })

    if (result.success) {
      console.log(`Email notification sent to ${profile.email} for ${event.type} (logged in: ${isLoggedIn})`)
      return true
    } else {
      console.error(`Failed to send email notification to ${profile.email}:`, result.error)
      return false
    }
  } catch (error) {
    console.error("Error sending notification email:", error)
    return false
  }
}

/**
 * Track user session activity
 */
export async function trackUserSession(userId: string, action: 'login' | 'logout', sessionToken?: string, userAgent?: string, ipAddress?: string) {
  try {
    const adminClient = createAdminClient()
    
    if (action === 'login') {
      // Create new session
      const { error } = await adminClient
        .from("user_sessions")
        .insert({
          user_id: userId,
          session_token: sessionToken || `session_${Date.now()}`,
          is_active: true,
          user_agent: userAgent,
          ip_address: ipAddress,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        })

      if (error) {
        console.error("Error creating user session:", error)
      }
    } else if (action === 'logout') {
      // Deactivate all sessions for user
      const { error } = await adminClient
        .from("user_sessions")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true)

      if (error) {
        console.error("Error deactivating user sessions:", error)
      }
    }
  } catch (error) {
    console.error("Error tracking user session:", error)
  }
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(userId: string, sessionToken: string) {
  try {
    const adminClient = createAdminClient()
    
    const { error } = await adminClient
      .from("user_sessions")
      .update({ 
        last_activity: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Extend by 24 hours
      })
      .eq("user_id", userId)
      .eq("session_token", sessionToken)
      .eq("is_active", true)

    if (error) {
      console.error("Error updating session activity:", error)
    }
  } catch (error) {
    console.error("Error updating session activity:", error)
  }
}
