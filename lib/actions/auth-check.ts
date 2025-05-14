"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { getJWTFromCookies, verifyJWT } from "@/lib/jwt"
import { createAdminClient } from "@/lib/supabase/admin"

export async function checkAuthStatus() {
  try {
    // Try JWT first
    const jwt = getJWTFromCookies()
    if (jwt) {
      const { payload, error } = await verifyJWT(jwt)
      if (!error && payload && (payload.sub || payload.userId)) {
        return {
          authenticated: true,
          userId: payload.sub || payload.userId,
          method: "jwt",
        }
      }
    }

    // Try Supabase session as fallback
    try {
      const cookieStore = cookies()
      const supabase = createServerClient(cookieStore)
      const { data } = await supabase.auth.getSession()

      if (data.session?.user?.id) {
        return {
          authenticated: true,
          userId: data.session.user.id,
          method: "supabase",
        }
      }
    } catch (error) {
      console.error("Error checking Supabase session:", error)
    }

    // Check for custom auth token
    const customAuthToken = cookies().get("custom-auth-token")?.value
    if (customAuthToken) {
      try {
        const adminClient = createAdminClient()
        const { data, error } = await adminClient
          .from("auth_users")
          .select("id")
          .eq("access_token", customAuthToken)
          .single()

        if (!error && data?.id) {
          return {
            authenticated: true,
            userId: data.id,
            method: "custom-auth",
          }
        }
      } catch (error) {
        console.error("Error checking custom auth token:", error)
      }
    }

    // If we get here, user is not authenticated
    return { authenticated: false }
  } catch (error) {
    console.error("Error in checkAuthStatus:", error)
    return { authenticated: false, error: String(error) }
  }
}

export async function getCurrentUserIdServer() {
  const authStatus = await checkAuthStatus()
  return authStatus.authenticated ? authStatus.userId : null
}
