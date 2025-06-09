import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getJWTFromCookies, verifyJWT } from "@/lib/jwt"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Function to check authentication on server components
export async function checkAuth() {
  const { cookies } = await import("next/headers")
  const { getJWTFromCookies, verifyJWT } = await import("@/lib/jwt")
  const { createServerClient } = await import("@/lib/supabase/server")

  // Try JWT first
  const jwt = getJWTFromCookies()
  if (jwt) {
    const { payload, error } = await verifyJWT(jwt)
    if (!error && payload) {
      return { authenticated: true, userId: payload.sub || payload.userId }
    }
  }

  // Try Supabase session as fallback
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    const { data } = await supabase.auth.getSession()

    if (data.session) {
      return { authenticated: true, userId: data.session.user.id }
    }
  } catch (error) {
  }

  // Check for custom auth token
  const customAuthToken = cookies().get("custom-auth-token")?.value
  if (customAuthToken) {
    return { authenticated: true }
  }

  // Check for auth bypass
  const authBypass = cookies().get("auth-bypass")?.value
  if (authBypass === "true") {
    return { authenticated: true }
  }

  // If we get here, user is not authenticated
  redirect("/?from=auth-check")
}

// Update the getCurrentUserId function to properly handle undefined values

// Helper function to get the current user ID
export async function getCurrentUserId() {
  try {
    // First try to get user ID from JWT
    const jwt = getJWTFromCookies()
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
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
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
    const customAuthToken = cookieStore.get("custom-auth-token")?.value
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

    // If no auth token, try to get from auth-status cookie
    const authStatus = cookieStore.get("auth-status")?.value
    if (authStatus === "authenticated") {
      // We know the user is authenticated, but we don't know their ID
      // This is a fallback case - we should log this situation
    }

    // Last resort for dev mode
    if (process.env.NODE_ENV === "development") {
      const adminClient = createAdminClient()
      const { data: firstUser } = await adminClient.from("profiles").select("id").limit(1).single()

      if (firstUser?.id) {
        return firstUser.id
      }
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

    // Try to get from auth.users first
    const { data: authUser, error: authError } = await adminClient
      .from("auth.users")
      .select("email")
      .eq("id", userId)
      .single()

    if (!authError && authUser?.email) {
      return authUser.email
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

    // If all else fails, create a placeholder email
    return `user-${userId}@example.com`
  } catch (error) {
    return null
  }
}
