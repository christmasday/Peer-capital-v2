"use server"

import { createAdminClient } from "@/lib/supabase/admin"

// Sync users from auth.users to public.auth_users
export async function syncAuthUsers() {
  try {
    const supabase = createAdminClient()

    // Get all users from auth.users
    const { data: authUsers, error: fetchError } = await supabase.auth.admin.listUsers()

    if (fetchError) {
      return { error: `Failed to fetch auth users: ${fetchError.message}` }
    }

    if (!authUsers || !authUsers.users || authUsers.users.length === 0) {
      return { error: "No auth users found to sync" }
    }


    // Keep track of phone numbers we've already processed to avoid duplicates
    const processedPhones = new Set<string>()

    // Process each user
    let syncedCount = 0
    let skippedCount = 0
    for (const user of authUsers.users) {
      try {
        // Check if user already exists in public.auth_users
        const { data: existingUser, error: checkError } = await supabase
          .from("auth_users")
          .select("id, phone")
          .eq("id", user.id)
          .maybeSingle()

        if (checkError) {
          skippedCount++
          continue // Skip this user and continue with others
        }

        // Handle phone number to avoid unique constraint violation
        let phoneToUse = user.phone

        // If phone exists and is not null/empty
        if (phoneToUse) {
          // Check if this phone number is already in our processed set
          if (processedPhones.has(phoneToUse)) {
            // Phone already exists, make it unique by appending user ID suffix
            phoneToUse = `${phoneToUse}_${user.id.substring(0, 8)}`
          } else {
            // Check if phone already exists in the database
            const { data: phoneExists, error: phoneCheckError } = await supabase
              .from("auth_users")
              .select("id")
              .eq("phone", phoneToUse)
              .neq("id", user.id) // Exclude current user
              .maybeSingle()

            if (phoneCheckError) {
            } else if (phoneExists) {
              // Phone already exists for another user, make it unique
              phoneToUse = `${phoneToUse}_${user.id.substring(0, 8)}`
            }
          }

          // Add to processed set
          processedPhones.add(user.phone)
        }

        // Prepare user data for insertion/update
        const userData = {
          id: user.id,
          email: user.email,
          phone: phoneToUse, // Use the potentially modified phone
          encrypted_password: null, // We don't copy the actual password for security
          email_confirmed_at: user.email_confirmed_at,
          phone_confirmed_at: user.phone_confirmed_at,
          confirmation_sent_at: user.confirmation_sent_at,
          recovery_sent_at: user.recovery_sent_at,
          email_change_sent_at: user.email_change_sent_at,
          email_change: user.email_change,
          last_sign_in_at: user.last_sign_in_at,
          raw_app_meta_data: user.app_metadata,
          raw_user_meta_data: user.user_metadata,
          is_super_admin: false, // Default value
          created_at: user.created_at,
          updated_at: user.updated_at,
          is_sso_user: false, // Default value
          banned_until: user.banned_until,
          reauthentication_sent_at: null, // Default value
          is_anonymous: false, // Default value
        }

        if (existingUser) {
          // Update existing user
          const { error: updateError } = await supabase.from("auth_users").update(userData).eq("id", user.id)

          if (updateError) {
            skippedCount++
            continue // Skip this user and continue with others
          }
        } else {
          // Insert new user
          const { error: insertError } = await supabase.from("auth_users").insert(userData)

          if (insertError) {

            // If it's a unique constraint violation, try one more time with null phone
            if (insertError.message.includes("unique constraint") && insertError.message.includes("phone")) {
              userData.phone = null

              const { error: retryError } = await supabase.from("auth_users").insert(userData)

              if (retryError) {
                skippedCount++
                continue // Skip this user and continue with others
              }
            } else {
              skippedCount++
              continue // Skip this user and continue with others
            }
          }
        }

        syncedCount++
      } catch (userError) {
        skippedCount++
      }
    }

    return { success: true, count: syncedCount, skipped: skippedCount }
  } catch (error) {
    return {
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Get users from public.auth_users
export async function getPublicAuthUsers(includeBalances = false) {
  try {
    const supabase = createAdminClient()

    if (includeBalances) {
      // Join with account_balances to get balance information
      const { data, error } = await supabase
        .from("auth_users")
        .select(`
          id, 
          email, 
          created_at, 
          raw_user_meta_data,
          account_balances!inner(balance, loan_balance)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        return { error: `Failed to fetch users: ${error.message}` }
      }

      // Transform the data to flatten the structure
      const usersWithBalances = data.map((user) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        raw_user_meta_data: user.raw_user_meta_data,
        balance: user.account_balances?.balance,
        loan_balance: user.account_balances?.loan_balance,
      }))

      return { users: usersWithBalances }
    } else {
      // Just get users without balance information
      const { data, error } = await supabase
        .from("auth_users")
        .select("id, email, created_at, raw_user_meta_data")
        .order("created_at", { ascending: false })

      if (error) {
        return { error: `Failed to fetch users: ${error.message}` }
      }

      return { users: data }
    }
  } catch (error) {
    return {
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
