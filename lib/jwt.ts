import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

// Update the JWT_SECRET handling to be more robust
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: JWT_SECRET environment variable is not set in production")
    }
    console.warn("⚠️ [JWT] JWT_SECRET not set — using insecure fallback (dev only)")
    return new TextEncoder().encode("fallback-secret-key-for-development-only")
  }
  return new TextEncoder().encode(secret)
}

// Secret key for JWT signing and verification
// In production, use a proper secret management system
const JWT_SECRET = getJWTSecret()

// JWT expiration time (24 hours)
const JWT_EXPIRATION = "24h"

// Cookie name for storing the JWT
export const JWT_COOKIE_NAME = "auth-token"

// Generate a JWT for a user
export async function generateJWT(payload: any) {
  try {
    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRATION)
      .sign(JWT_SECRET)

    return { jwt }
  } catch (error) {
    return { error: "Failed to generate authentication token" }
  }
}

// Verify a JWT
export async function verifyJWT(token: string) {
  try {
    if (!token) {
      return { error: "No token provided" }
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { payload }
  } catch (error) {
    return { error: "Invalid or expired token" }
  }
}

// Set JWT in cookies
export async function setJWTCookie(jwt: string) {
  try {
    const cookieStore = await cookies()
    cookieStore.set(JWT_COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
      sameSite: "lax",
    })

    // Also set a non-HTTP-only cookie for client-side detection
    cookieStore.set("auth-status", "authenticated", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
      sameSite: "lax",
    })

    return true
  } catch (error) {
    return false
  }
}

// Get JWT from cookies (server-side)
export async function getJWTFromCookies() {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(JWT_COOKIE_NAME)?.value
  } catch (error) {
    return null
  }
}

// Clear JWT cookies
export async function clearJWTCookies() {
  try {
    const cookieStore = await cookies()
    cookieStore.set(JWT_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      path: "/",
      sameSite: "lax",
    })

    cookieStore.set("auth-status", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      path: "/",
      sameSite: "lax",
    })

    return true
  } catch (error) {
    return false
  }
}
