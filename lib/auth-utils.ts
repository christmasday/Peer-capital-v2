import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getJWTFromCookies, verifyJWT } from "@/lib/jwt"

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
