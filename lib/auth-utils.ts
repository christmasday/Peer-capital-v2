import { cookies } from "next/headers"
import { getJWTFromCookies, verifyJWT } from "@/lib/jwt"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Function to check authentication on server components
export async function checkAuth(preventRedirect = false) {
  const { cookies } = await import("next/headers")
  const { getJWTFromCookies, verifyJWT } = await import("@/lib/jwt")
  const { createServerClient } = await import("@/lib/supabase/server")

  // Try JWT first
  const jwt = await getJWTFromCookies()
  if (jwt) {
    const { payload, error } = await verifyJWT(jwt)
    if (!error && payload) {
      return { authenticated: true, userId: payload.sub || payload.userId }
    }
  }

  // Try Supabase session as fallback
  try {
    const supabase = createServerClient()
    const { data } = await supabase.auth.getSession()

    if (data.session) {
      return { authenticated: true, userId: data.session.user.id }
    }
  } catch (error) {
  }

  // Check for custom auth token — validate against DB
  const cookieStore2 = await cookies()
  const customAuthToken = cookieStore2.get("custom-auth-token")?.value
  if (customAuthToken) {
    try {
      const adminClient = createAdminClient()
      const { data: userData, error } = await adminClient
        .from("auth_users")
        .select("id")
        .eq("access_token", customAuthToken)
        .single()

      if (!error && userData?.id) {
        return { authenticated: true, userId: userData.id }
      }
    } catch {
      // Token invalid — fall through
    }
  }

  // If we get here, user is not authenticated
  if (preventRedirect) {
    return { authenticated: false, userId: null }
  }
  const { redirect } = await import("next/navigation")
  redirect("/?from=auth-check")
}

// Update the getCurrentUserId function to properly handle undefined values

// Helper function to get the current user ID
export async function getCurrentUserId() {
  try {
    // First try to get user ID from JWT
    const jwt = await getJWTFromCookies()
    if (jwt) {
      try {
        const { payload, error } = await verifyJWT(jwt)
        if (!error && payload && (payload.userId || payload.sub)) {
          const userId = payload.userId || payload.sub
          // Validate the userId is a proper UUID before returning
          if (userId && userId !== "undefined" && typeof userId === "string") {
            return userId
          }
        }
      } catch (error) {
      }
    }

    // If no JWT, try to get from Supabase session
    const supabase = createServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user?.id) {
      // Validate the userId is a proper UUID before returning
      if (session.user.id !== "undefined" && typeof session.user.id === "string") {
        return session.user.id
      }
    }

    // If no Supabase session, try to get from custom auth token
    const cookieStoreForAuth = await cookies()
    const customAuthToken = cookieStoreForAuth.get("custom-auth-token")?.value
    if (customAuthToken) {
      const { createAdminClient } = await import("@/lib/supabase/admin")
      const adminClient = createAdminClient()
      const { data: userData, error } = await adminClient
        .from("auth_users")
        .select("id")
        .eq("access_token", customAuthToken)
        .single()

      if (!error && userData && userData.id) {
        // Validate the userId is a proper UUID before returning
        if (userData.id !== "undefined" && typeof userData.id === "string") {
          return userData.id
        }
      }
    }

    // If no auth token, auth-status cookie alone is not sufficient
    // (it doesn't provide a userId and can be forged)

    // Last resort for dev mode — only if DEV_FALLBACK_USER_ID is explicitly set
    if (process.env.NODE_ENV === "development" && process.env.DEV_FALLBACK_USER_ID) {
      console.warn("⚠️ [getCurrentUserId] No auth found — using DEV_FALLBACK_USER_ID (dev only)")
      return process.env.DEV_FALLBACK_USER_ID
    }

    return null
  } catch (error) {
    return null
  }
}

// Helper function to get user email
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const adminClient = createAdminClient()

    // Try to get from auth.users via the admin API
    try {
      const { data: { user }, error: authError } = await adminClient.auth.admin.getUserById(userId)
      if (!authError && user?.email) {
        return user.email
      }
    } catch {
      // Admin API may not be available, fall through
    }

    // Try to get from profiles table
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single()

    if (!profileError && profile?.email) {
      return profile.email
    }

    // If all else fails, return null (no valid email found)
    return null
  } catch (error) {
    return null
  }
}
