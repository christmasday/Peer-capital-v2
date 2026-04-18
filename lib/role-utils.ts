import { createAdminClient } from "@/lib/supabase/admin"

export type UserRole = 'user' | 'admin' | 'moderator' | 'support'

/**
 * Check if a user has a specific role
 */
export async function userHasRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
      .from("user_roles")
      .select("role_type")
      .eq("user_id", userId)
      .eq("role_type", role)
      .single()

    if (error) {
      console.error("Error checking user role:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error in userHasRole:", error)
    return false
  }
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  try {
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
      .from("user_roles")
      .select("role_type")
      .eq("user_id", userId)

    if (error) {
      console.error("Error getting user roles:", error)
      return []
    }

    return data?.map(role => role.role_type as UserRole) || []
  } catch (error) {
    console.error("Error in getUserRoles:", error)
    return []
  }
}

/**
 * Check if user has any of the specified roles
 */
export async function userHasAnyRole(userId: string, roles: UserRole[]): Promise<boolean> {
  try {
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
      .from("user_roles")
      .select("role_type")
      .eq("user_id", userId)
      .in("role_type", roles)

    if (error) {
      console.error("Error checking user roles:", error)
      return false
    }

    return (data?.length || 0) > 0
  } catch (error) {
    console.error("Error in userHasAnyRole:", error)
    return false
  }
}

/**
 * Add a role to a user
 */
export async function addUserRole(userId: string, role: UserRole, createdBy?: string): Promise<boolean> {
  try {
    const adminClient = createAdminClient()
    
    const { error } = await adminClient
      .from("user_roles")
      .insert({
        user_id: userId,
        role_type: role,
        created_by: createdBy || userId
      })

    if (error) {
      console.error("Error adding user role:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in addUserRole:", error)
    return false
  }
}

/**
 * Remove a role from a user
 */
export async function removeUserRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const adminClient = createAdminClient()
    
    const { error } = await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role_type", role)

    if (error) {
      console.error("Error removing user role:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in removeUserRole:", error)
    return false
  }
}

/**
 * Check if current user is admin or support staff
 */
export async function isStaffMember(userId: string): Promise<boolean> {
  return userHasAnyRole(userId, ['admin', 'support'])
}

/**
 * Check if current user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return userHasRole(userId, 'admin')
}
