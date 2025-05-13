import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/jwt"
import { createAdminClient, isOfflineMode } from "@/lib/supabase/admin"

// Update the publicPaths array in the isPublicPath function
export function isPublicPath(path: string): boolean {
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/contact",
    "/faq",
    "/privacy-policy",
    "/terms",
    "/cookie-policy",
    "/disclaimers",
  ]
  return publicPaths.some((publicPath) => path === publicPath || path.startsWith(`${publicPath}/`))
}

// Helper function to check if a path is a static asset
export function isStaticAsset(path: string): boolean {
  return (
    path.startsWith("/_next/") ||
    path.startsWith("/favicon.ico") ||
    path.includes(".png") ||
    path.includes(".jpg") ||
    path.includes(".svg")
  )
}

// Update the verifyAuth function to check for custom auth token
export async function verifyAuth(req: NextRequest) {
  try {
    // First try JWT verification (doesn't require database)
    const token = req.cookies.get("jwt-token")?.value

    if (token) {
      const { payload, error } = await verifyJWT(token)

      if (!error && payload && payload.sub) {
        // JWT is valid
        return {
          authenticated: true,
          userId: payload.sub,
          method: "jwt",
        }
      }
    }

    // Check for custom auth token
    const customAuthToken = req.cookies.get("custom-auth-token")?.value

    if (customAuthToken) {
      try {
        const adminClient = createAdminClient()
        const { data, error } = await adminClient
          .from("auth_users")
          .select("id")
          .eq("access_token", customAuthToken)
          .single()

        if (!error && data) {
          return {
            authenticated: true,
            userId: data.id,
            method: "custom-auth",
          }
        }
      } catch (error) {
        console.error("Error verifying custom auth token:", error)
        // Continue with other auth methods
      }
    }

    // Check for auth-status cookie
    const authStatus = req.cookies.get("auth-status")?.value
    if (authStatus === "authenticated") {
      return {
        authenticated: true,
        userId: null,
        method: "auth-status",
      }
    }

    // Check for auth-bypass cookie
    const authBypass = req.cookies.get("auth-bypass")?.value
    if (authBypass === "true") {
      return {
        authenticated: true,
        userId: null,
        method: "auth-bypass",
      }
    }

    // If offline mode is active, allow with warning
    if (isOfflineMode()) {
      return {
        authenticated: true,
        userId: null,
        method: "offline-fallback",
      }
    }

    // Check Supabase session as fallback (with timeout)
    const sessionPromise = checkSupabaseSession(req)
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          authenticated: true,
          userId: null,
          method: "timeout-fallback",
        })
      }, 2000) // 2 second timeout
    })

    return await Promise.race([sessionPromise, timeoutPromise])
  } catch (error) {
    console.error("Auth verification error:", error instanceof Error ? error.message : String(error))
    // On error, allow as fallback
    return {
      authenticated: true,
      userId: null,
      method: "error-fallback",
    }
  }
}

// Helper to check Supabase session
async function checkSupabaseSession(req: NextRequest) {
  try {
    // Try to get the custom auth token
    const customAuthToken = req.cookies.get("custom-auth-token")?.value

    if (customAuthToken) {
      const supabase = createAdminClient()

      // Verify the token with a short timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1500) // 1.5 second timeout

      try {
        // Check if the token exists in our auth_users table
        const { data, error } = await supabase
          .from("auth_users")
          .select("id")
          .eq("access_token", customAuthToken)
          .single()

        clearTimeout(timeoutId)

        if (error || !data) {
          // Continue to check other auth methods
        } else {
          return {
            authenticated: true,
            userId: data.id,
            method: "custom-auth",
          }
        }
      } catch (e) {
        clearTimeout(timeoutId)
        console.error("Custom auth token verification error:", e instanceof Error ? e.message : String(e))
      }
    }

    // Try to get the Supabase session token
    const supabaseToken =
      req.cookies.get("sb-access-token")?.value ||
      req.cookies.get("sb:token")?.value ||
      req.cookies.get("sb-auth-token")?.value

    if (!supabaseToken) {
      return { authenticated: false }
    }

    const supabase = createAdminClient()

    // Verify the session with a short timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500) // 1.5 second timeout

    try {
      const { data, error } = await supabase.auth.getSession()
      clearTimeout(timeoutId)

      if (error || !data.session) {
        return { authenticated: false }
      }

      return {
        authenticated: true,
        userId: data.session.user.id,
        method: "supabase",
      }
    } catch (e) {
      clearTimeout(timeoutId)
      return { authenticated: false }
    }
  } catch (error) {
    return { authenticated: false }
  }
}

// Helper to redirect to login
export function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone()
  url.pathname = "/"
  url.searchParams.set("redirectedFrom", req.nextUrl.pathname)
  return NextResponse.redirect(url)
}
