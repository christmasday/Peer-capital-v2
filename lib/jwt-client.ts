// JWT cookie name (must match the server-side value)
export const JWT_COOKIE_NAME = "auth-token"

// Store JWT in localStorage
export function storeJWT(jwt: string) {
  try {
    localStorage.setItem("jwt-token", jwt)
    return true
  } catch (error) {
    return false
  }
}

// Get JWT from localStorage
export function getJWTFromStorage() {
  try {
    return localStorage.getItem("jwt-token")
  } catch (error) {
    return null
  }
}

// Clear JWT from localStorage
export function clearJWTFromStorage() {
  try {
    localStorage.removeItem("jwt-token")
    return true
  } catch (error) {
    return false
  }
}

// Parse JWT payload (client-side only)
export function parseJWT(token: string) {
  try {
    // Split the token and get the payload part
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}

// Check if JWT is expired (client-side only)
// bufferSeconds: treat as expired if within this many seconds of expiry
export function isJWTExpired(token: string, bufferSeconds = 0) {
  try {
    const payload = parseJWT(token)
    if (!payload || !payload.exp) return true

    // exp is in seconds, Date.now() is in milliseconds
    return (payload.exp - bufferSeconds) * 1000 < Date.now()
  } catch (error) {
    return true // Assume expired on error
  }
}

// Get JWT from cookies on client
// NOTE: The primary "auth-token" cookie is HttpOnly and cannot be read from JS.
// We check "auth-status" to detect if auth is present, and use localStorage "jwt-token" for the actual token.
export function getJWTFromClientCookies(): string | null {
  if (typeof document === "undefined") return null

  // First try to get from localStorage (where storeJWT puts it)
  const storedToken = getJWTFromStorage()
  if (storedToken) return storedToken

  // Check auth-status cookie to confirm auth is set (non-HttpOnly companion cookie)
  const value = `; ${document.cookie}`
  const parts = value.split(`; auth-status=`)
  if (parts.length === 2) {
    const authStatus = parts.pop()?.split(";").shift()
    if (authStatus === "authenticated") {
      // Auth cookie is present but HttpOnly — return token from storage or null
      return null
    }
  }
  return null
}

// Check if token is valid by checking with server
export async function checkTokenValidity(token: string): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/verify-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.valid === true
  } catch (error) {
    return false
  }
}

// Get user ID from token by checking with server
export async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/get-user-id", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.userId || null
  } catch (error) {
    return null
  }
}
