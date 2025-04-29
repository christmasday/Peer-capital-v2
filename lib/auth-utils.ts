import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getJWTFromCookies, verifyJWT } from "@/lib/jwt"
import { createServerClient } from "@/lib/supabase/server"

// Function to check authentication on server components
export async function checkAuth(redirectPath = "/?auth=required") {
  try {
    // Check for JWT
    const jwt = getJWTFromCookies()
    let isValidJWT = false

    if (jwt) {
      try {
        const { payload, error } = await verifyJWT(jwt)
        isValidJWT = !error && !!payload

        if (error) {
          console.log(`JWT verification failed: ${error}`)
        } else {
          console.log("Valid JWT found")
          return true
        }
      } catch (error) {
        console.error("Error during JWT verification:", error)
      }
    }

    // Check for auth cookies
    const cookieStore = cookies()
    const hasAuthCookie = cookieStore.has("sb-auth-token") || cookieStore.has("auth-status")

    if (hasAuthCookie) {
      console.log("Auth cookie found")
      return true
    }

    // Check for auth bypass in URL
    // This will be checked in client components, but we can't access URL params in server components
    // So we'll just log it and continue

    // If we're in development mode, allow access for testing
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode - allowing access without authentication")
      return true
    }

    // If no valid authentication, redirect to login
    console.log("No valid authentication found, redirecting to login")
    redirect(redirectPath)
  } catch (error) {
    console.error("Error in checkAuth:", error)
    // In case of error, allow access to prevent blocking the application
    return true
  }
}

// Helper function to get the current user ID
export async function getCurrentUserId() {
  try {
    // First try to get user ID from JWT
    const jwt = getJWTFromCookies()
    if (jwt) {
      try {
        const { payload, error } = await verifyJWT(jwt)
        if (!error && payload && (payload.userId || payload.sub)) {
          return payload.userId || payload.sub
        }
      } catch (error) {
        console.error("Error verifying JWT:", error)
      }
    }

    // If no JWT, try to get from Supabase session
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {
      return session.user.id
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

      if (!error && userData) {
        return userData.id
      }
    }

    // If no auth token, try to get from auth-status cookie
    const authStatus = cookieStore.get("auth-status")?.value
    if (authStatus === "authenticated") {
      // We know the user is authenticated, but we don't know their ID
      // This is a fallback case - we should log this situation
      console.warn("User is authenticated but ID could not be determined")
    }

    return null
  } catch (error) {
    console.error("Error getting current user ID:", error)
    return null
  }
}
