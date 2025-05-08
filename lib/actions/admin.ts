"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { v4 as uuidv4 } from "uuid"
import { getCurrentUserId } from "@/lib/auth-utils"

// Check if the current user is an admin
async function isAdmin(userId: string) {
  try {
    const adminClient = createAdminClient()

    // Check if user has admin role in auth_users table
    const { data, error } = await adminClient.from("auth_users").select("raw_user_meta_data").eq("id", userId).single()

    if (error || !data) {
      console.error("Error checking admin status:", error)
      return false
    }

    // Check if user has admin role in metadata
    return data.raw_user_meta_data?.role === "admin"
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

// Admin action to reset a user's password
export async function adminResetUserPassword(formData: FormData) {
  try {
    // Get current user ID and check if they're an admin
    const currentUserId = await getCurrentUserId()

    if (!currentUserId) {
      return { error: "You must be logged in to perform this action" }
    }

    const adminCheck = await isAdmin(currentUserId)

    if (!adminCheck) {
      console.error("Non-admin user attempted to reset password:", currentUserId)
      return { error: "You do not have permission to perform this action" }
    }

    // Get form data
    const userId = formData.get("userId") as string
    const resetMethod = formData.get("resetMethod") as string
    const newPassword = formData.get("newPassword") as string

    if (!userId) {
      return { error: "User ID is required" }
    }

    if (!resetMethod) {
      return { error: "Reset method is required" }
    }

    const adminClient = createAdminClient()

    // Log the action for audit purposes
    await adminClient
      .from("admin_audit_logs")
      .insert({
        id: uuidv4(),
        admin_id: currentUserId,
        action: "password_reset",
        target_user_id: userId,
        details: { reset_method: resetMethod },
        created_at: new Date().toISOString(),
      })
      .catch((error) => {
        // Log but don't fail if audit logging fails
        console.error("Error logging admin action:", error)
      })

    // Get user email for sending reset link
    const { data: userData, error: userError } = await adminClient
      .from("auth_users")
      .select("email")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.error("Error fetching user data:", userError)
      return { error: "User not found" }
    }

    if (resetMethod === "temporary_password") {
      // Validate new password
      if (!newPassword || newPassword.length < 8) {
        return { error: "Please provide a valid temporary password (minimum 8 characters)" }
      }

      // Hash the new password
      const { hashPassword } = await import("@/lib/auth-utils/password")
      const hashedPassword = await hashPassword(newPassword)

      // Update the user's password
      const { error: updateError } = await adminClient
        .from("auth_users")
        .update({
          encrypted_password: hashedPassword,
          updated_at: new Date().toISOString(),
          // Set a flag to force password change on next login
          raw_user_meta_data: {
            ...userData.raw_user_meta_data,
            force_password_change: true,
          },
        })
        .eq("id", userId)

      if (updateError) {
        console.error("Error updating password:", updateError)
        return { error: "Failed to update password" }
      }

      return {
        success: true,
        message: `Temporary password set for user. They will be required to change it on next login.`,
      }
    } else if (resetMethod === "reset_link") {
      // Import the createPasswordResetToken and sendPasswordResetEmail functions
      const { createPasswordResetToken, sendPasswordResetEmail } = await import("@/lib/actions/auth")

      // Create a reset token
      const tokenResult = await createPasswordResetToken(userId)

      if (!tokenResult.success || !tokenResult.token) {
        console.error("Failed to create reset token:", tokenResult.error)
        return { error: "Failed to create password reset token" }
      }

      // Send the reset email
      const emailResult = await sendPasswordResetEmail(userData.email, tokenResult.token)

      if (!emailResult.success) {
        console.error("Failed to send reset email:", emailResult.error)
        return { error: "Failed to send password reset email" }
      }

      return {
        success: true,
        message: `Password reset link sent to ${userData.email}`,
      }
    } else {
      return { error: "Invalid reset method" }
    }
  } catch (error) {
    console.error("Error in adminResetUserPassword:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Get users for admin panel
export async function getUsers(search?: string, page = 1, limit = 10) {
  try {
    // Get current user ID and check if they're an admin
    const currentUserId = await getCurrentUserId()

    if (!currentUserId) {
      return { error: "You must be logged in to perform this action" }
    }

    const adminCheck = await isAdmin(currentUserId)

    if (!adminCheck) {
      console.error("Non-admin user attempted to access user list:", currentUserId)
      return { error: "You do not have permission to perform this action" }
    }

    const adminClient = createAdminClient()

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query
    let query = adminClient
      .from("auth_users")
      .select("id, email, created_at, last_sign_in_at, raw_user_meta_data", { count: "exact" })

    // Add search filter if provided
    if (search) {
      query = query.ilike("email", `%${search}%`)
    }

    // Add pagination
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching users:", error)
      return { error: "Failed to fetch users" }
    }

    return {
      users: data,
      totalCount: count || 0,
      currentPage: page,
      totalPages: count ? Math.ceil(count / limit) : 0,
    }
  } catch (error) {
    console.error("Error in getUsers:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Ensure admin audit logs table exists
export async function ensureAdminAuditLogsTable() {
  try {
    console.log("Ensuring admin_audit_logs table exists")
    const adminClient = createAdminClient()

    // Check if the table exists directly using information_schema
    const { data, error } = await adminClient
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "admin_audit_logs")
      .maybeSingle()

    if (error) {
      console.error("Error checking if admin_audit_logs table exists:", error)
      return false
    }

    if (!data) {
      console.log("Creating admin_audit_logs table")

      // Create the table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          admin_id UUID NOT NULL REFERENCES auth_users(id),
          action TEXT NOT NULL,
          target_user_id UUID REFERENCES auth_users(id),
          details JSONB,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS admin_audit_logs_admin_id_idx ON public.admin_audit_logs(admin_id);
        CREATE INDEX IF NOT EXISTS admin_audit_logs_target_user_id_idx ON public.admin_audit_logs(target_user_id);
        CREATE INDEX IF NOT EXISTS admin_audit_logs_action_idx ON public.admin_audit_logs(action);
      `

      const { error: createError } = await adminClient.rpc("execute_sql", { sql_query: createTableSQL })

      if (createError) {
        console.error("Error creating admin_audit_logs table:", createError)
        return false
      }

      console.log("admin_audit_logs table created successfully")
    } else {
      console.log("admin_audit_logs table already exists")
    }

    return true
  } catch (error) {
    console.error("Unexpected error in ensureAdminAuditLogsTable:", error)
    return false
  }
}

// Get admin audit logs
export async function getAdminAuditLogs(page = 1, limit = 20) {
  try {
    // Get current user ID and check if they're an admin
    const currentUserId = await getCurrentUserId()

    if (!currentUserId) {
      return { error: "You must be logged in to perform this action" }
    }

    const adminCheck = await isAdmin(currentUserId)

    if (!adminCheck) {
      console.error("Non-admin user attempted to access audit logs:", currentUserId)
      return { error: "You do not have permission to perform this action" }
    }

    // Ensure the audit logs table exists
    await ensureAdminAuditLogsTable()

    const adminClient = createAdminClient()

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Get audit logs with admin and target user information
    const { data, error, count } = await adminClient
      .from("admin_audit_logs")
      .select(
        `
        id, 
        action, 
        details, 
        created_at,
        admin:admin_id(id, email),
        target:target_user_id(id, email)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching audit logs:", error)
      return { error: "Failed to fetch audit logs" }
    }

    return {
      logs: data,
      totalCount: count || 0,
      currentPage: page,
      totalPages: count ? Math.ceil(count / limit) : 0,
    }
  } catch (error) {
    console.error("Error in getAdminAuditLogs:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Export the isAdmin function for use in other modules
export { isAdmin }
