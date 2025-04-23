"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function syncAuthUsers() {
  try {
    console.log("Starting auth users sync...")
    const adminClient = createAdminClient()

    // Get all users from Supabase Auth
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()

    if (authError) {
      console.error("Error fetching Supabase auth users:", authError)
      return { error: "Failed to fetch Supabase auth users" }
    }

    if (!authUsers || !authUsers.users || authUsers.users.length === 0) {
      console.log("No Supabase auth users found")
      return { success: true, message: "No users to sync" }
    }

    console.log(`Found ${authUsers.users.length} Supabase auth users`)

    // Get existing users from our custom auth table
    const { data: existingUsers, error: existingError } = await adminClient
      .from("auth_users")
      .select("id, email, phone")

    if (existingError) {
      console.error("Error fetching existing custom auth users:", existingError)
      return { error: "Failed to fetch existing custom auth users" }
    }

    const existingUserMap = new Map((existingUsers || []).map((user) => [user.id, user]))
    const existingPhones = new Set((existingUsers || []).filter((user) => user.phone).map((user) => user.phone))

    // Process each Supabase auth user
    let syncedCount = 0
    let errorCount = 0
    let skippedCount = 0

    for (const user of authUsers.users) {
      try {
        // Skip if user already exists in our custom auth table
        if (existingUserMap.has(user.id)) {
          console.log(`User ${user.id} already exists in custom auth table, skipping`)
          skippedCount++
          continue
        }

        // Handle phone number uniqueness
        let phoneToUse = user.phone
        if (phoneToUse && existingPhones.has(phoneToUse)) {
          // Phone number already exists, make it unique by appending user ID suffix
          const suffix = user.id.substring(0, 4)
          phoneToUse = `${phoneToUse}-${suffix}`
          console.log(`Modified duplicate phone number for user ${user.id}: ${user.phone} -> ${phoneToUse}`)
        }

        // If phone is not null, add it to the set of existing phones
        if (phoneToUse) {
          existingPhones.add(phoneToUse)
        }

        // Generate a temporary password hash (users will need to reset)
        const { hashPassword } = await import("@/lib/auth-utils/password")
        const tempPassword = await hashPassword("TemporaryPassword123!")

        // Insert user into our custom auth table
        try {
          const { error: insertError } = await adminClient.from("auth_users").insert({
            id: user.id,
            email: user.email,
            phone: phoneToUse,
            encrypted_password: tempPassword,
            raw_user_meta_data: user.user_metadata || {},
            raw_app_meta_data: user.app_metadata || {},
            created_at: user.created_at,
            updated_at: new Date().toISOString(),
            email_confirmed_at: user.email_confirmed_at,
            phone_confirmed_at: user.phone_confirmed_at,
            last_sign_in_at: user.last_sign_in_at,
          })

          if (insertError) {
            // If there's a unique constraint violation on phone, try again with null phone
            if (
              insertError.message.includes("auth_users_phone_key") ||
              (insertError.message.includes("duplicate key") && insertError.message.includes("phone"))
            ) {
              console.warn(`Phone number constraint violation for user ${user.id}, retrying with null phone`)

              const { error: retryError } = await adminClient.from("auth_users").insert({
                id: user.id,
                email: user.email,
                phone: null, // Set phone to null to avoid constraint violation
                encrypted_password: tempPassword,
                raw_user_meta_data: user.user_metadata || {},
                raw_app_meta_data: user.app_metadata || {},
                created_at: user.created_at,
                updated_at: new Date().toISOString(),
                email_confirmed_at: user.email_confirmed_at,
                phone_confirmed_at: user.phone_confirmed_at,
                last_sign_in_at: user.last_sign_in_at,
              })

              if (retryError) {
                console.error(`Error syncing user ${user.id} (retry with null phone):`, retryError)
                errorCount++
                continue
              }
            } else {
              console.error(`Error syncing user ${user.id}:`, insertError)
              errorCount++
              continue
            }
          }

          syncedCount++
        } catch (insertError) {
          console.error(`Exception syncing user ${user.id}:`, insertError)
          errorCount++
        }
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError)
        errorCount++
      }
    }

    console.log(`Sync completed: ${syncedCount} users synced, ${skippedCount} skipped, ${errorCount} errors`)

    return {
      success: true,
      message: `Sync completed: ${syncedCount} users synced, ${skippedCount} skipped, ${errorCount} errors`,
    }
  } catch (error) {
    console.error("Unexpected error during auth users sync:", error)
    return { error: "An unexpected error occurred during sync" }
  }
}
