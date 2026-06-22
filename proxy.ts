import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createAdminClient, isOfflineMode } from "@/lib/supabase/admin"
import { verifyJWT, JWT_COOKIE_NAME } from "@/lib/jwt"

export async function proxy(req: NextRequest) {
  // Skip auth checks for public routes and static assets
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
    "/about-us",
    "/risk-disclosure",
    "/aml-policy",
    "/kyc-policy",
  ]

  // API routes that do NOT require proxy auth (they handle their own or are public)
  const publicApiPaths = [
    "/api/auth/refresh",
    "/api/auth/signup",
    "/api/auth/check-signup-availability",
    "/api/auth/send-confirmation-code",
    "/api/auth/verify-confirmation-code",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/verify-token",
    "/api/sync-auth-users",
    "/api/sr/onboard-user",
    "/api/sr/verify-otp",
    "/api/sr/webhook",
  ]

  const path = req.nextUrl.pathname

  // Check if the path starts with any of the public paths
  if (publicPaths.some((publicPath) => path === publicPath || path.startsWith(`${publicPath}/`))) {
    return NextResponse.next()
  }

  // Skip auth for static assets
  if (
    path.startsWith("/_next/") ||
    path.startsWith("/favicon.ico") ||
    path.includes(".png") ||
    path.includes(".jpg") ||
    path.includes(".svg")
  ) {
    return NextResponse.next()
  }

  // Skip auth only for explicitly listed public API routes
  if (publicApiPaths.some((apiPath) => path === apiPath || path.startsWith(`${apiPath}/`))) {
    return NextResponse.next()
  }

  try {
    // Check for JWT token (primary auth method)
    const token = req.cookies.get(JWT_COOKIE_NAME)?.value || req.cookies.get("jwt-token")?.value

    if (token) {
      const { payload, error } = await verifyJWT(token)

      if (!error && payload && (payload.sub || payload.userId)) {
        // JWT is valid, allow request
        return NextResponse.next()
      }
    }

    // If offline mode is active, allow the request with a warning
    if (isOfflineMode() || process.env.SKIP_SUPABASE_PING === "true") {
      return NextResponse.next()
    }

    // Check Supabase session as fallback (with timeout)
    const sessionPromise = checkSupabaseSession(req)
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve({ valid: false, fallback: true })
      }, 2000) // 2 second timeout — fail-closed
    })

    const { valid } = (await Promise.race([sessionPromise, timeoutPromise])) as any

    if (valid) {
      return NextResponse.next()
    }

    // Not authenticated, redirect to login
    const url = req.nextUrl.clone()
    url.pathname = "/"
    url.searchParams.set("redirectedFrom", req.nextUrl.pathname)
    return NextResponse.redirect(url)
  } catch (error) {
    // Fail-closed: on error, deny access and redirect to login
    console.error("[proxy] Auth error, denying access:", error instanceof Error ? error.message : String(error))
    const url = req.nextUrl.clone()
    url.pathname = "/"
    url.searchParams.set("redirectedFrom", req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
}

// Update the checkSupabaseSession function to also check our custom auth table
async function checkSupabaseSession(req: NextRequest) {
  try {
    // Try to get the custom auth token
    const customAuthToken = req.cookies.get("custom-auth-token")?.value

    if (customAuthToken) {
      // If SKIP_SUPABASE_PING is set, don't actually check with database
      if (process.env.SKIP_SUPABASE_PING === "true") {
        return { valid: true, fallback: true }
      }

      const supabase = createAdminClient()

      // Verify the token with a short timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1500) // 1.5 second timeout

      try {
        // Check if the token exists in our auth_users table
        const { data, error } = await supabase.from("auth_users").select("id").eq("access_token", customAuthToken).single()

        clearTimeout(timeoutId)

        if (error) {
        } else if (data) {
          return { valid: true }
        }
      } catch (e) {
        clearTimeout(timeoutId)
      }
    }

    // Try to get the Supabase session token as fallback
    const supabaseToken =
      req.cookies.get("sb-access-token")?.value ||
      req.cookies.get("sb:token")?.value ||
      req.cookies.get("sb-auth-token")?.value

    if (!supabaseToken) {
      return { valid: false }
    }

    // If SKIP_SUPABASE_PING is set, don't actually check with Supabase
    if (process.env.SKIP_SUPABASE_PING === "true") {
      return { valid: true, fallback: true }
    }

    const supabase = createAdminClient()

    // Verify the session with a short timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500) // 1.5 second timeout

    try {
      const { data, error } = await supabase.auth.getSession()
      clearTimeout(timeoutId)

      if (error) {
        return { valid: false }
      }

      if (!data.session) {
        return { valid: false }
      }

      return { valid: true }
    } catch (e) {
      clearTimeout(timeoutId)
      return { valid: false }
    }
  } catch (error) {
    return { valid: false }
  }
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals
    "/((?!_next/static|_next/image).*)",
  ],
}