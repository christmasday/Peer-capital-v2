// JWT cookie name (must match the server-side value)
export const JWT_COOKIE_NAME = "auth-token"

// Store JWT in localStorage
export function storeJWT(jwt: string) {
  try {
    localStorage.setItem("jwt-token", jwt)
    return true
  } catch (error) {
    console.error("Error storing JWT in localStorage:", error)
    return false
  }
}

// Get JWT from localStorage
export function getJWTFromStorage() {
  try {
    return localStorage.getItem("jwt-token")
  } catch (error) {
    console.error("Error getting JWT from localStorage:", error)
    return null
  }
}

// Clear JWT from localStorage
export function clearJWTFromStorage() {
  try {
    localStorage.removeItem("jwt-token")
    return true
  } catch (error) {
    console.error("Error clearing JWT from localStorage:", error)
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
    console.error("Error parsing JWT:", error)
    return null
  }
}

// Check if JWT is expired (client-side only)
export function isJWTExpired(token: string) {
  try {
    const payload = parseJWT(token)
    if (!payload || !payload.exp) return true

    // exp is in seconds, Date.now() is in milliseconds
    return payload.exp * 1000 < Date.now()
  } catch (error) {
    console.error("Error checking JWT expiration:", error)
    return true // Assume expired on error
  }
}
