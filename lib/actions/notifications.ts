"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { getCurrentUserId } from "@/lib/auth-utils"

// Updated notification types to include review type
export type NotificationType =
  | "message"
  | "connection_request"
  | "connection_accepted"
  | "loan_request"
  | "loan_approved"
  | "loan_rejected"
  | "transaction"
  | "system"
  | "follow"
  | "deposit"
  | "withdrawal"
  | "virtual_account_created"
  | "virtual_account_funded"
  | "profile_updated"
  | "verification_started"
  | "verification_completed"
  | "account_created"
  | "security_alert"
  | "review" // Added review notification type

export interface Notification {
  id: string
  user_id: string
  actor_id: string | null
  type: NotificationType
  content?: string
  data?: any
  reference_id?: string
  is_read: boolean
  created_at: string
  updated_at: string
}

// Rest of the file remains unchanged
export interface NotificationData {
  [key: string]: any
}

// Updated notification preferences interface with activity-specific settings
export interface NotificationPreferences {
  id: string
  user_id: string
  // Notification channels
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  marketing_emails: boolean
  transaction_alerts: boolean
  security_alerts: boolean

  // Activity-specific notification settings
  transaction_activity: boolean
  loan_activity: boolean
  connection_activity: boolean
  message_activity: boolean
  verification_activity: boolean
  account_activity: boolean
  system_activity: boolean

  created_at: string
  updated_at: string
}

export async function getNotificationPreferences(userId?: string) {
  try {
    // If userId is not provided, get the current user ID
    if (!userId) {
      userId = await getCurrentUserId()
      if (!userId) {
        return { success: false, error: new Error("User ID is required") }
      }
    }

    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      console.error("Error getting notification preferences:", error)
      return { success: false, error }
    }

    // If no preferences exist, return default preferences
    if (!data) {
      return {
        success: true,
        preferences: {
          user_id: userId,
          email_notifications: true,
          push_notifications: true,
          sms_notifications: true,
          marketing_emails: false,
          transaction_alerts: true,
          security_alerts: true,

          // Default activity-specific notification settings
          transaction_activity: true,
          loan_activity: true,
          connection_activity: true,
          message_activity: true,
          verification_activity: true,
          account_activity: true,
          system_activity: true,
        },
      }
    }

    return { success: true, preferences: data }
  } catch (error) {
    console.error("Error in getNotificationPreferences:", error)
    return { success: false, error }
  }
}

export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences> & { user_id: string },
) {
  try {
    const { user_id, ...preferencesToUpdate } = preferences
    const adminClient = createAdminClient()

    // Check if preferences exist for this user
    const { data: existingPreferences, error: checkError } = await adminClient
      .from("notification_preferences")
      .select("id")
      .eq("user_id", user_id)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking notification preferences:", checkError)
      return { success: false, error: checkError }
    }

    let result
    const now = new Date().toISOString()

    if (existingPreferences) {
      // Update existing preferences
      const { data, error } = await adminClient
        .from("notification_preferences")
        .update({
          ...preferencesToUpdate,
          updated_at: now,
        })
        .eq("user_id", user_id)
        .select()
        .single()

      if (error) {
        console.error("Error updating notification preferences:", error)
        return { success: false, error }
      }

      result = data
    } else {
      // Insert new preferences
      const { data, error } = await adminClient
        .from("notification_preferences")
        .insert({
          id: uuidv4(),
          user_id,
          ...preferencesToUpdate,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating notification preferences:", error)
        return { success: false, error }
      }

      result = data
    }

    revalidatePath("/profile/notifications")
    return { success: true, preferences: result }
  } catch (error) {
    console.error("Error in updateNotificationPreferences:", error)
    return { success: false, error }
  }
}

// Rest of the file remains unchanged
export async function createNotification({
  userId,
  actorId,
  type,
  data = {},
}: {
  userId: string
  actorId?: string
  type: NotificationType
  data?: NotificationData
}) {
  try {
    if (!userId) {
      console.error("createNotification called with empty userId")
      return { success: false, error: "User ID is required" }
    }

    console.log(`Creating notification for user ${userId} of type ${type}`)

    // Always use admin client for all operations to bypass RLS
    const adminClient = createAdminClient()

    // STEP 1: Check if profile exists
    console.log(`Checking if profile exists for user ${userId}`)
    const { data: existingProfile, error: profileCheckError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (profileCheckError) {
      console.error(`Error checking profile existence for ${userId}:`, profileCheckError)
      return { success: false, error: profileCheckError }
    }

    // STEP 2: Create profile if it doesn't exist
    if (!existingProfile) {
      console.log(`Profile doesn't exist for ${userId}, creating now...`)

      const { error: createProfileError } = await adminClient.from("profiles").insert({
        id: userId,
        first_name: null,
        last_name: null,
        profile_picture_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (createProfileError) {
        console.error(`Failed to create profile for ${userId}:`, createProfileError)
        return { success: false, error: createProfileError }
      }

      console.log(`Successfully created profile for ${userId}`)
    } else {
      console.log(`Profile already exists for ${userId}`)
    }

    // STEP 3: Verify profile was created successfully
    const { data: verifyProfile, error: verifyError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single()

    if (verifyError || !verifyProfile) {
      console.error(`Failed to verify profile for ${userId}:`, verifyError || "Profile not found after creation")
      return { success: false, error: verifyError || new Error("Profile not found after creation") }
    }

    console.log(`Verified profile exists for ${userId}, proceeding with notification creation`)

    // STEP 4: Create notification with actor_id as null
    const notificationData = {
      ...data,
      ...(actorId ? { original_actor_id: actorId } : {}),
    }

    const now = new Date().toISOString()

    console.log(`Inserting notification for ${userId}`)
    const { data: notification, error: notificationError } = await adminClient
      .from("notifications")
      .insert({
        id: uuidv4(),
        user_id: userId,
        actor_id: null, // Always set to null to avoid foreign key issues
        type,
        data: notificationData,
        is_read: false,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (notificationError) {
      console.error(`Error creating notification for ${userId}:`, notificationError)
      return { success: false, error: notificationError }
    }

    console.log(`Successfully created notification for ${userId}`)
    return { success: true, notification }
  } catch (error) {
    console.error("Unexpected error in createNotification:", error)
    return { success: false, error }
  }
}

export async function getNotifications(pageOrUserId?: number | string, limit = 10, includeRead = false) {
  try {
    let userId: string
    let page = 1

    // Determine if the first parameter is a page number or userId
    if (typeof pageOrUserId === "number") {
      // It's a page number
      page = pageOrUserId
      userId = await getCurrentUserId()
      if (!userId) {
        return { error: "You must be logged in to view notifications" }
      }
    } else if (
      typeof pageOrUserId === "string" &&
      pageOrUserId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    ) {
      // It's a UUID
      userId = pageOrUserId
      page = 1
    } else {
      // No parameter or invalid parameter, get current user
      userId = await getCurrentUserId()
      if (!userId) {
        return { error: "You must be logged in to view notifications" }
      }
      page = 1
    }

    const adminClient = createAdminClient()
    const offset = (page - 1) * limit

    // Build query
    let query = adminClient
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by read status if needed
    if (!includeRead) {
      query = query.eq("is_read", false)
    }

    const { data: notifications, error, count } = await query

    if (error) {
      console.error("Error getting notifications:", error)
      return { error: "Failed to get notifications" }
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await adminClient
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (countError) {
      console.error("Error getting unread count:", countError)
    }

    return {
      notifications,
      count,
      unreadCount: unreadCount || 0,
    }
  } catch (error) {
    console.error("Unexpected error getting notifications:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function getUnreadNotificationsCount() {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: true, count: 0 } // Return 0 if not logged in
    }

    const supabase = createServerClient()

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) {
      console.error("Error fetching unread notifications count:", error)
      return { success: false, error: error.message }
    }

    return { success: true, count: count || 0 }
  } catch (error) {
    console.error("Error in getUnreadNotificationsCount:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // First check if the notification exists
    const { data: existingNotification, error: checkError } = await adminClient
      .from("notifications")
      .select("id, is_read")
      .eq("id", notificationId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking notification existence:", checkError)
      return { success: false, error: checkError }
    }

    // If notification doesn't exist, return early
    if (!existingNotification) {
      console.log(`Notification ${notificationId} not found`)
      return { success: false, error: new Error("Notification not found") }
    }

    // If notification is already read, return early with success
    if (existingNotification.is_read) {
      console.log(`Notification ${notificationId} is already marked as read`)
      return { success: true, notification: existingNotification }
    }

    // Update the notification with updated_at timestamp
    const now = new Date().toISOString()
    const { data, error } = await adminClient
      .from("notifications")
      .update({
        is_read: true,
        updated_at: now,
      })
      .eq("id", notificationId)
      .select()

    if (error) {
      console.error("Error marking notification as read:", error)
      return { success: false, error }
    }

    revalidatePath("/notifications")
    return { success: true, notification: data?.[0] || null }
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error)
    return { success: false, error }
  }
}

export async function markAllNotificationsAsRead(userId?: string) {
  try {
    // If userId is not provided, get the current user ID
    if (!userId) {
      userId = await getCurrentUserId()
      if (!userId) {
        return { success: false, error: new Error("User ID is required") }
      }
    }

    console.log(`Marking all notifications as read for user ${userId}`)

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Update all unread notifications with updated_at timestamp
    const now = new Date().toISOString()
    const { data, error } = await adminClient
      .from("notifications")
      .update({
        is_read: true,
        updated_at: now,
      })
      .eq("user_id", userId)
      .eq("is_read", false)
      .select()

    if (error) {
      console.error(`Error marking all notifications as read for ${userId}:`, error)
      return { success: false, error }
    }

    console.log(`Successfully marked ${data?.length || 0} notifications as read for ${userId}`)
    revalidatePath("/notifications")
    return { success: true, notifications: data }
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error)
    return { success: false, error }
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // First check if the notification exists
    const { data: existingNotification, error: checkError } = await adminClient
      .from("notifications")
      .select("id")
      .eq("id", notificationId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking notification existence:", checkError)
      return { success: false, error: checkError }
    }

    // If notification doesn't exist, return early with success (already deleted)
    if (!existingNotification) {
      console.log(`Notification ${notificationId} not found (already deleted)`)
      return { success: true }
    }

    // Delete the notification
    const { error } = await adminClient.from("notifications").delete().eq("id", notificationId)

    if (error) {
      console.error("Error deleting notification:", error)
      return { success: false, error }
    }

    revalidatePath("/notifications")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteNotification:", error)
    return { success: false, error }
  }
}
