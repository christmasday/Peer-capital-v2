import { signIn, refreshJWT } from "@/lib/actions/auth"
import { createServerClient } from "@/lib/supabase/server"
import { generateJWT, setJWTCookie } from "@/lib/jwt"
import { cookies } from "next/headers"
import { describe, beforeEach, it, expect, jest } from "@jest/globals"

// Mock dependencies
jest.mock("@/lib/supabase/server", () => ({
  createServerClient: jest.fn(),
}))

jest.mock("@/lib/jwt", () => ({
  generateJWT: jest.fn(),
  setJWTCookie: jest.fn(),
  JWT_COOKIE_NAME: "auth-token",
}))

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}))

describe("Auth Actions", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("signIn", () => {
    it("should return error when email or password is missing", async () => {
      // Create FormData with missing fields
      const formData = new FormData()

      // Test with missing email and password
      const result = await signIn(formData)

      expect(result).toEqual({ error: "Email and password are required" })
      expect(createServerClient).not.toHaveBeenCalled()
    })

    it("should return error when Supabase authentication fails", async () => {
      // Mock Supabase client
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            error: { message: "Invalid login credentials" },
            data: { user: null, session: null },
          }),
        },
      }
      ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

      // Create FormData with valid fields
      const formData = new FormData()
      formData.append("email", "test@example.com")
      formData.append("password", "password123")

      // Test sign in with invalid credentials
      const result = await signIn(formData)

      expect(result).toEqual({ error: "Invalid login credentials" })
      expect(createServerClient).toHaveBeenCalled()
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      })
    })

    it("should return success and JWT when authentication succeeds", async () => {
      // Mock successful user and session
      const mockUser = { id: "user-123", email: "test@example.com" }
      const mockSession = { id: "session-123", access_token: "token123" }

      // Mock Supabase client
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            error: null,
            data: { user: mockUser, session: mockSession },
          }),
        },
      }
      ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

      // Mock JWT generation
      const mockJwt = "jwt-token-123"
      ;(generateJWT as jest.Mock).mockResolvedValue({ jwt: mockJwt })
      ;(setJWTCookie as jest.Mock).mockReturnValue(true)

      // Mock cookies
      const mockCookieStore = {
        set: jest.fn(),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)

      // Create FormData with valid fields
      const formData = new FormData()
      formData.append("email", "test@example.com")
      formData.append("password", "password123")

      // Test successful sign in
      const result = await signIn(formData)

      // Verify Supabase was called correctly
      expect(createServerClient).toHaveBeenCalled()
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      })

      // Verify JWT was generated and set
      expect(generateJWT).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: "user",
        sessionId: mockSession.id,
      })
      expect(setJWTCookie).toHaveBeenCalledWith(mockJwt)

      // Verify cookies were set
      expect(mockCookieStore.set).toHaveBeenCalledTimes(3)
      expect(mockCookieStore.set).toHaveBeenCalledWith("sb-auth-token", mockSession.access_token, expect.any(Object))
      expect(mockCookieStore.set).toHaveBeenCalledWith("auth-status", "authenticated", expect.any(Object))
      expect(mockCookieStore.set).toHaveBeenCalledWith("auth-bypass", "true", expect.any(Object))

      // Verify result
      expect(result).toEqual({
        success: true,
        user: mockUser,
        redirectUrl: "/home",
        session: mockSession,
        jwt: mockJwt,
      })
    })

    it("should handle JWT generation errors gracefully", async () => {
      // Mock successful user and session
      const mockUser = { id: "user-123", email: "test@example.com" }
      const mockSession = { id: "session-123", access_token: "token123" }

      // Mock Supabase client
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            error: null,
            data: { user: mockUser, session: mockSession },
          }),
        },
      }
      ;(createServerClient as jest.Mock).mockReturnValue(mockSupabase)

      // Mock JWT generation failure
      ;(generateJWT as jest.Mock).mockResolvedValue({ error: "JWT generation failed" })

      // Mock cookies
      const mockCookieStore = {
        set: jest.fn(),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)

      // Create FormData with valid fields
      const formData = new FormData()
      formData.append("email", "test@example.com")
      formData.append("password", "password123")

      // Test sign in with JWT generation failure
      const result = await signIn(formData)

      // Verify result still succeeds with Supabase session
      expect(result).toEqual({
        success: true,
        user: mockUser,
        redirectUrl: "/home",
        session: mockSession,
        jwt: null,
      })

      // Verify cookies were still set for Supabase session
      expect(mockCookieStore.set).toHaveBeenCalledWith("sb-auth-token", mockSession.access_token, expect.any(Object))
      expect(mockCookieStore.set).toHaveBeenCalledWith("auth-status", "authenticated", expect.any(Object))
    })
  })

  describe("refreshJWT", () => {
    it("should return error for invalid token", async () => {
      // Mock JWT verification to fail
      jest.mock("@/lib/jwt", () => ({
        ...jest.requireActual("@/lib/jwt"),
        verifyJWT: jest.fn().mockResolvedValue({ error: "Invalid token", payload: null }),
      }))

      const result = await refreshJWT("invalid-token")

      expect(result).toEqual({ error: "Invalid token" })
    })

    // Add more tests for refreshJWT functionality
  })
})
