// Client-side authentication utilities
import { getJWTFromStorage, parseJWT, checkTokenValidity, getUserIdFromToken } from "./jwt-client"

// Get the current user ID from client-side
export async function getCurrentUserIdClient(): Promise<string | null> {
  try {
    // Try to get user ID from JWT in localStorage
    const jwtToken = getJWTFromStorage()
    if (jwtToken) {
      // First, check if the token is valid with the server
      const isValid = await checkTokenValidity(jwtToken)
      if (isValid) {
        // Get the user ID from the server
        return await getUserIdFromToken(jwtToken)
      }

      // Fallback: Try to parse the token locally
      // This is less secure but works as a fallback
      try {
        const payload = parseJWT(jwtToken)
        const userId = payload?.sub || payload?.userId
        if (userId && userId !== "undefined" && typeof userId === "string") {
          return userId
        }
      } catch (error) {
        console.error("Error parsing JWT on client:", error)
      }
    }

    // Try to get from Supabase session
    try {
      const { createClientComponentClient } = await import("@supabase/auth-helpers-nextjs")
      const supabase = createClientComponentClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user?.id) {
        return session.user.id
      }
    } catch (error) {
      console.error("Error getting Supabase session on client:", error)
    }

    // Check auth status with server
    try {
      const response = await fetch("/api/auth/status", {
        method: "GET",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.authenticated && data.userId) {
          return data.userId
        }
      }
    } catch (error) {
      console.error("Error checking auth status with server:", error)
    }

    return null
  } catch (error) {
    console.error("Error getting current user ID on client:", error)
    return null
  }
}

// Check if user is authenticated on client
export async function isAuthenticatedClient(): Promise<boolean> {
  const userId = await getCurrentUserIdClient()
  return userId !== null
}

// Helper function to get cookie value on the client
export function getCookieValue(name: string): string | undefined {
  if (typeof document === "undefined") return undefined

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift()
  }
  return undefined
}
