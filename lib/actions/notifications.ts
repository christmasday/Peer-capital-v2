"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserProfile } from "@/lib/actions/auth"

export type NotificationPreferences = {
  id: string
  user_id: string
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  transaction_alerts: boolean
  security_alerts: boolean
  created_at: string
  updated_at: string
}

// Default notification preferences
const DEFAULT_PREFERENCES: Omit<NotificationPreferences, "id" | "user_id" | "created_at" | "updated_at"> = {
  email_notifications: true,
  sms_notifications: false,
  push_notifications: false,
  marketing_emails: true,
  transaction_alerts: true,
  security_alerts: true,
}

// Get notification preferences for the current user
export async function getNotificationPreferences(): Promise<{
  preferences?: NotificationPreferences
  error?: string
}> {
  try {
    // Get the current user profile
    const userProfile = await getUserProfile()

    if (!userProfile || !userProfile.user || !userProfile.user.id) {
      return { error: "User not authenticated" }
    }

    const userId = userProfile.user.id
    const supabase = createServerClient()
    const adminClient = createAdminClient()

    // Fetch notification preferences using maybeSingle() instead of single()
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      console.error("Error fetching notification preferences:", error)
      return { error: "Failed to fetch notification preferences" }
    }

    // If preferences don't exist, create them
    if (!data) {
      console.log("No notification preferences found for user, creating defaults")

      // First verify that the user exists in auth_users table
      const { data: userExists, error: userCheckError } = await adminClient
        .from("auth_users")
        .select("id")
        .eq("id", userId)
        .maybeSingle()

      if (userCheckError) {
        console.error("Error checking if user exists:", userCheckError)
        return { error: "Failed to verify user existence" }
      }

      if (!userExists) {
        console.error("User does not exist in auth_users table:", userId)
        return {
          preferences: {
            id: "temp-id",
            user_id: userId,
            ...DEFAULT_PREFERENCES,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }
      }

      // Create default notification preferences with retry logic
      let retryCount = 0
      const maxRetries = 3
      let createError = null
      let newPrefs = null

      while (retryCount < maxRetries) {
        try {
          const now = new Date().toISOString()
          const { data: createdPrefs, error: insertError } = await adminClient
            .from("notification_preferences")
            .insert({
              user_id: userId,
              ...DEFAULT_PREFERENCES,
              created_at: now,
              updated_at: now,
            })
            .select("*")
            .maybeSingle()

          if (insertError) {
            console.error(`Error creating notification preferences (attempt ${retryCount + 1}):`, insertError)
            createError = insertError
            retryCount++

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 500))
          } else {
            newPrefs = createdPrefs
            break // Success, exit the loop
          }
        } catch (err) {
          console.error(`Exception during notification preferences creation (attempt ${retryCount + 1}):`, err)
          createError = err
          retryCount++

          if (retryCount >= maxRetries) {
            break
          }

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      if (!newPrefs) {
        console.error("Failed to create notification preferences after retries")

        // Return default preferences anyway to prevent UI errors
        return {
          preferences: {
            id: "temp-id",
            user_id: userId,
            ...DEFAULT_PREFERENCES,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }
      }

      return { preferences: newPrefs as NotificationPreferences }
    }

    return { preferences: data as NotificationPreferences }
  } catch (error) {
    console.error("Unexpected error fetching notification preferences:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Update notification preferences for the current user
export async function updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<{
  success?: boolean
  error?: string
}> {
  try {
    // Get the current user profile
    const userProfile = await getUserProfile()

    if (!userProfile || !userProfile.user || !userProfile.user.id) {
      return { error: "User not authenticated" }
    }

    const userId = userProfile.user.id
    const supabase = createServerClient()
    const adminClient = createAdminClient()

    // Check if preferences exist
    const { data: existingPrefs, error: checkError } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking notification preferences:", checkError)
      return { error: "Failed to check notification preferences" }
    }

    // Remove id and user_id from the update data if present
    const { id, user_id, created_at, ...updateData } = preferences as any

    // Add updated_at timestamp
    const dataToUpdate = {
      ...updateData,
      updated_at: new Date().toISOString(),
    }

    if (!existingPrefs) {
      // First verify that the user exists in auth_users table
      const { data: userExists, error: userCheckError } = await adminClient
        .from("auth_users")
        .select("id")
        .eq("id", userId)
        .maybeSingle()

      if (userCheckError) {
        console.error("Error checking if user exists:", userCheckError)
        return { error: "Failed to verify user existence" }
      }

      if (!userExists) {
        console.error("User does not exist in auth_users table:", userId)
        return { error: "User does not exist" }
      }

      // Create new preferences if they don't exist
      const { error: createError } = await adminClient.from("notification_preferences").insert({
        user_id: userId,
        ...DEFAULT_PREFERENCES,
        ...dataToUpdate,
        created_at: new Date().toISOString(),
      })

      if (createError) {
        console.error("Error creating notification preferences:", createError)
        return { error: "Failed to create notification preferences" }
      }
    } else {
      // Update existing preferences
      const { error: updateError } = await supabase
        .from("notification_preferences")
        .update(dataToUpdate)
        .eq("user_id", userId)

      if (updateError) {
        console.error("Error updating notification preferences:", updateError)
        return { error: "Failed to update notification preferences" }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error updating notification preferences:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Ensure notification preferences exist for a user
export async function ensureNotificationPreferences(userId: string): Promise<{
  success?: boolean
  error?: string
}> {
  try {
    const adminClient = createAdminClient()

    // First verify that the user exists in auth_users table
    const { data: userExists, error: userCheckError } = await adminClient
      .from("auth_users")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (userCheckError) {
      console.error("Error checking if user exists:", userCheckError)
      return { error: "Failed to verify user existence", fallback: true }
    }

    if (!userExists) {
      console.error("User does not exist in auth_users table:", userId)
      return { error: "User does not exist in auth_users table", fallback: true }
    }

    // Check if preferences already exist
    const { data, error: checkError } = await adminClient
      .from("notification_preferences")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking notification preferences:", checkError)
      return { error: "Failed to check notification preferences", fallback: true }
    }

    // If preferences already exist, return success
    if (data) {
      return { success: true }
    }

    // Create default notification preferences with retry logic
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        const { error: insertError } = await adminClient.from("notification_preferences").insert({
          user_id: userId,
          ...DEFAULT_PREFERENCES,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertError) {
          console.error(`Error creating notification preferences (attempt ${retryCount + 1}):`, insertError)
          retryCount++

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 500))
        } else {
          // Success!
          console.log("Notification preferences created successfully for user:", userId)
          return { success: true }
        }
      } catch (insertError) {
        console.error(`Exception during notification preferences creation (attempt ${retryCount + 1}):`, insertError)
        retryCount++

        if (retryCount >= maxRetries) {
          return { error: "Failed to create notification preferences after maximum retries", fallback: true }
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // If we get here, all retries failed
    console.warn("All retries failed when creating notification preferences")
    return { success: true, fallback: true, warning: "Failed to create notification preferences after maximum retries" }
  } catch (error) {
    console.error("Unexpected error ensuring notification preferences:", error)
    return { error: "An unexpected error occurred", fallback: true }
  }
}
