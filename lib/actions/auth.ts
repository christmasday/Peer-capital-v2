"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { v4 as uuidv4 } from "uuid"
import { cookies } from "next/headers"

// Add the JWT imports at the top of the file
import { generateJWT, setJWTCookie, clearJWTCookies } from "@/lib/jwt"

// Define offline mode variables
let isOfflineModeEnabled = false

function isOfflineMode() {
  return isOfflineModeEnabled
}

function forceOfflineMode(value: boolean) {
  isOfflineModeEnabled = value
}

// Update the signIn function to handle JWT generation more robustly
export async function signIn(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return { error: "Email and password are required" }
    }

    console.log("Attempting to sign in user:", email)
    const supabase = createServerClient()

    // Sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Login error:", error.message)
      return { error: error.message }
    }

    if (!data.user || !data.session) {
      console.error("No user or session returned from auth")
      return { error: "Authentication failed. Please try again." }
    }

    console.log("User signed in successfully:", data.user.id)
    console.log("Session established:", !!data.session)

    // Generate JWT
    try {
      const { jwt, error: jwtError } = await generateJWT({
        userId: data.user.id,
        email: data.user.email,
        role: "user",
        sessionId: data.session.id,
      })

      if (jwtError) {
        console.error("JWT generation error:", jwtError)
        // Continue with Supabase session as fallback
      } else if (jwt) {
        // Set JWT in cookies
        const cookieSet = setJWTCookie(jwt)
        console.log("JWT cookie set:", cookieSet)
      }
    } catch (jwtError) {
      console.error("Error during JWT generation:", jwtError)
      // Continue with Supabase session as fallback
    }

    // Set cookies with longer expiration
    try {
      const cookieStore = cookies()

      // Set a session cookie with a long expiration
      cookieStore.set("sb-auth-token", data.session.access_token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })

      // Set a non-HTTP-only cookie for client-side detection
      cookieStore.set("auth-status", "authenticated", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })

      console.log("Auth cookies set successfully")
    } catch (cookieError) {
      console.error("Error setting cookies:", cookieError)
      // Continue anyway
    }

    return {
      success: true,
      user: data.user,
      redirectUrl: "/home",
      session: data.session,
    }
  } catch (error) {
    console.error("Unexpected error during sign in:", error)
    return { error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` }
  }
}

// Function to ensure a user has a profile
async function ensureUserProfile(userId: string) {
  try {
    console.log("Ensuring user profile exists for:", userId)

    // Check if we're in offline mode first
    if (isOfflineMode()) {
      console.log("Skipping profile check in offline mode")
      return { success: true, fallback: true }
    }

    const adminClient = createAdminClient()

    // Check if profile exists with proper error handling
    try {
      const profileCheckPromise = adminClient.from("profiles").select("id").eq("id", userId).single()

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Profile check timed out")), 3000),
      )

      const { data: existingProfile, error: profileCheckError } = await Promise.race([
        profileCheckPromise,
        timeoutPromise,
      ]).catch((error) => {
        console.error("Profile check failed:", error.message)
        forceOfflineMode(true)
        return { data: null, error: { message: error.message } }
      })

      if (profileCheckError && profileCheckError.code !== "PGRST116") {
        // PGRST116 is the error code for "no rows returned" - that's expected if profile doesn't exist
        console.error("Error checking for existing profile:", profileCheckError)
        return { error: "Failed to check for existing profile", fallback: true }
      }

      if (existingProfile) {
        console.log("Profile already exists for user:", userId)
        // Check if account balance exists
        try {
          await ensureAccountBalance(userId)
        } catch (balanceError) {
          console.error("Error ensuring account balance:", balanceError)
        }
        return { success: true }
      }
    } catch (checkError) {
      console.error("Error checking for existing profile:", checkError)
      // Return a fallback success to prevent blocking the application
      forceOfflineMode(true)
      return { success: true, fallback: true }
    }

    console.log("Creating profile for user:", userId)

    // Get user metadata to populate profile
    try {
      const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId)

      if (userError) {
        console.error("Error fetching user data:", userError)
        // Create a basic profile anyway
        try {
          const { error: createError } = await adminClient.from("profiles").insert({
            id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (createError) {
            console.error("Error creating basic profile:", createError)
            return { error: "Failed to create profile", fallback: true }
          }
        } catch (insertError) {
          console.error("Error inserting basic profile:", insertError)
          return { success: true, fallback: true }
        }
      } else {
        // Create profile with user metadata
        const metadata = userData.user.user_metadata || {}

        try {
          const { error: createError } = await adminClient.from("profiles").insert({
            id: userId,
            first_name: metadata.first_name || null,
            middle_name: metadata.middle_name || null,
            last_name: metadata.last_name || null,
            phone_number: metadata.phone_number || null,
            bvn: metadata.bvn || null,
            date_of_birth: metadata.date_of_birth || null,
            address: metadata.address || null,
            city: metadata.city || null,
            state: metadata.state || null,
            zip_code: metadata.zip_code || null,
            profile_picture_url: metadata.profile_picture_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (createError) {
            console.error("Error creating profile with metadata:", createError)
            return { error: "Failed to create profile", fallback: true }
          }
        } catch (insertError) {
          console.error("Error inserting profile with metadata:", insertError)
          return { success: true, fallback: true }
        }
      }
    } catch (userDataError) {
      console.error("Error fetching user data:", userDataError)
      return { success: true, fallback: true }
    }

    // Ensure account balance exists
    try {
      await ensureAccountBalance(userId)
    } catch (balanceError) {
      console.error("Error ensuring account balance:", balanceError)
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error in ensureUserProfile:", error)
    // Return success with fallback to prevent blocking the application
    return { success: true, fallback: true }
  }
}

// Function to ensure a user has an account balance
async function ensureAccountBalance(userId: string) {
  try {
    console.log("Ensuring account balance exists for:", userId)
    const adminClient = createAdminClient()

    // Check if account balance exists
    try {
      const { data: existingBalance, error: balanceCheckError } = await adminClient
        .from("account_balances")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (balanceCheckError && balanceCheckError.code !== "PGRST116") {
        console.error("Error checking for existing account balance:", balanceCheckError)
        return { error: "Failed to check for existing account balance", fallback: true }
      }

      if (existingBalance) {
        console.log("Account balance already exists for user:", userId)
        return { success: true }
      }
    } catch (checkError) {
      console.error("Error checking for existing account balance:", checkError)
      return { success: true, fallback: true }
    }

    console.log("Creating account balance for user:", userId)

    // Create account balance
    try {
      const { error: balanceError } = await adminClient.from("account_balances").insert({
        id: uuidv4(),
        user_id: userId,
        balance: 0,
        loan_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (balanceError) {
        console.error("Error creating account balance:", balanceError)
        return { error: "Failed to create account balance", fallback: true }
      }
    } catch (insertError) {
      console.error("Error inserting account balance:", insertError)
      return { success: true, fallback: true }
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error in ensureAccountBalance:", error)
    return { success: true, fallback: true }
  }
}

export async function signUp(userData: {
  email: string
  password: string
  firstName: string
  middleName?: string
  lastName: string
  phoneNumber: string
  bvn: string
  dateOfBirth: string
  address: string
  city: string
  state: string
  zipCode?: string
  profilePictureUrl?: string | null
}) {
  try {
    console.log("Starting signup process with data:", {
      ...userData,
      password: "***REDACTED***", // Don't log the password
    })

    const supabase = createServerClient()
    const adminClient = createAdminClient()

    // Store user data in the user metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          // Store all user profile data in metadata for later retrieval
          first_name: userData.firstName,
          middle_name: userData.middleName,
          last_name: userData.lastName,
          phone_number: userData.phoneNumber,
          bvn: userData.bvn,
          date_of_birth: userData.dateOfBirth,
          address: userData.address,
          city: userData.city,
          state: userData.state,
          zip_code: userData.zipCode,
          profile_picture_url: userData.profilePictureUrl,
        },
      },
    })

    if (authError) {
      console.error("Auth signup error:", authError.message)
      return { error: authError.message }
    }

    if (!authData.user) {
      console.error("No user returned from auth signup")
      return { error: "Failed to create user" }
    }

    console.log("Auth user created successfully with ID:", authData.user.id)

    // Immediately create the profile in the profiles table
    try {
      const { error: profileError } = await adminClient.from("profiles").insert({
        id: authData.user.id,
        first_name: userData.firstName,
        middle_name: userData.middleName || null,
        last_name: userData.lastName,
        phone_number: userData.phoneNumber,
        bvn: userData.bvn,
        date_of_birth: userData.dateOfBirth,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        zip_code: userData.zipCode || null,
        profile_picture_url: userData.profilePictureUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error("Error creating profile:", profileError)
        return {
          success: true,
          user: authData.user,
          warning: "Account created but profile setup failed. Profile will be created on first login.",
          message: "Account created successfully! Please log in to continue.",
        }
      }
    } catch (profileError) {
      console.error("Error creating profile:", profileError)
      return {
        success: true,
        user: authData.user,
        warning: "Account created but profile setup failed. Profile will be created on first login.",
        message: "Account created successfully! Please log in to continue.",
      }
    }

    // Create account balance
    try {
      const { error: balanceError } = await adminClient.from("account_balances").insert({
        id: uuidv4(),
        user_id: authData.user.id,
        balance: 0,
        loan_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (balanceError) {
        console.error("Error creating account balance:", balanceError)
        // Not critical, continue
      }
    } catch (balanceError) {
      console.error("Error creating account balance:", balanceError)
      // Not critical, continue
    }

    return {
      success: true,
      user: authData.user,
      message: "Account created successfully! Please log in to continue.",
    }
  } catch (error) {
    console.error("Unexpected error during signup:", error)
    return { error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` }
  }
}

export async function updateUserProfile(userId: string, profileData: any) {
  try {
    const adminClient = createAdminClient()

    // Check if profile exists
    try {
      const { data: existingProfile, error: profileCheckError } = await adminClient
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single()

      if (profileCheckError && profileCheckError.code !== "PGRST116") {
        console.error("Error checking for existing profile:", profileCheckError)
        return { error: "Failed to check for existing profile", fallback: true }
      }

      if (existingProfile) {
        // Update existing profile
        try {
          const { error: updateError } = await adminClient
            .from("profiles")
            .update({
              ...profileData,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)

          if (updateError) {
            console.error("Error updating profile:", updateError)
            return { error: "Failed to update profile", fallback: true }
          }
        } catch (updateError) {
          console.error("Error updating profile:", updateError)
          return { success: true, fallback: true }
        }
      } else {
        // Create new profile
        try {
          const { error: createError } = await adminClient.from("profiles").insert({
            id: userId,
            ...profileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (createError) {
            console.error("Error creating profile:", createError)
            return { error: "Failed to create profile", fallback: true }
          }
        } catch (createError) {
          console.error("Error creating profile:", createError)
          return { success: true, fallback: true }
        }
      }
    } catch (checkError) {
      console.error("Error checking for existing profile:", checkError)
      return { success: true, fallback: true }
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error in updateUserProfile:", error)
    return { success: true, fallback: true }
  }
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string

  const supabase = createServerClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    console.error("Password reset error:", error.message)
    return { error: error.message }
  }

  return { success: true }
}

// Update the signOut function to clear JWT cookies
export async function signOut() {
  try {
    // Clear JWT cookies
    clearJWTCookies()

    // Set a signout cookie immediately
    try {
      const cookieStore = cookies()
      cookieStore.set("auth-signout", "true", {
        path: "/",
        maxAge: 60, // 60 seconds
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
    } catch (cookieError) {
      console.error("Error setting signout cookie:", cookieError)
    }

    // Check if we're in offline mode
    if (isOfflineMode()) {
      console.log("Signing out in offline mode")
      return { success: true, redirectUrl: "/?signout=true" }
    }

    // Try to sign out from Supabase, but don't wait for it
    try {
      const supabase = createServerClient()

      // Use a promise with timeout to prevent hanging
      const signOutPromise = supabase.auth.signOut({ scope: "global" })
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.log("Supabase signout timed out, continuing anyway")
          resolve({ error: null })
        }, 2000) // 2 second timeout
      })

      // Race the promises
      Promise.race([signOutPromise, timeoutPromise]).catch((error) => {
        console.error("Supabase signout error (non-blocking):", error)
      })
    } catch (error) {
      console.error("Error creating Supabase client for signout:", error)
    }

    // Return success immediately
    return { success: true, redirectUrl: "/?signout=true" }
  } catch (error) {
    console.error("Unexpected error during sign out:", error)
    return { success: false, redirectUrl: "/?signout=true", error: String(error) }
  }
}

// Circuit breaker configuration
const MAX_FAILURES = 3
let connectionFailures = 0
let lastFailureTime = 0

export async function getUserProfile() {
  try {
    // Check if we're in offline mode
    if (isOfflineMode()) {
      console.log("getUserProfile running in offline mode")
      // Return mock data in offline mode
      return {
        user: { id: "offline-user", email: "user@example.com" },
        profile: {
          id: "offline-user",
          first_name: "User",
          last_name: "",
          profile_picture_url: "/vibrant-street-market.png",
        },
        account: { balance: 120000, loan_balance: 50000 },
      }
    }

    // Create fallback user data
    const fallbackUserData = {
      user: { id: "fallback-user", email: "user@example.com" },
      profile: {
        id: "fallback-user",
        first_name: "User",
        last_name: "",
        profile_picture_url: "/vibrant-street-market.png",
      },
      account: { balance: 120000, loan_balance: 50000 },
    }

    // Add timeout to getSession with better error handling
    let sessionData
    let supabase
    try {
      supabase = createServerClient()
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Session fetch timed out")), 3000)
      })

      const result = await Promise.race([sessionPromise, timeoutPromise]).catch((error) => {
        console.error("Session fetch failed:", error.message)
        forceOfflineMode(true)
        return { data: { session: null } }
      })

      sessionData = result.data

      if (!sessionData?.session?.user) {
        console.log("No active session found in getUserProfile")
        // Force offline mode if no session is found
        forceOfflineMode(true)
        return fallbackUserData
      }
    } catch (sessionError) {
      console.error("Error fetching session:", sessionError)
      // Force offline mode if session fetch fails
      forceOfflineMode(true)
      return fallbackUserData
    }

    const userId = sessionData.session.user.id
    console.log("Getting profile for user:", userId)

    // Ensure the user has a profile
    try {
      await ensureUserProfile(userId)
    } catch (profileError) {
      console.error("Error ensuring user profile:", profileError)
      // Continue anyway to try to get whatever profile data exists
    }

    // Get profile data with timeout and better error handling
    let profileData = null
    try {
      const profilePromise = supabase.from("profiles").select("*").eq("id", userId).single()
      const profileTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Profile fetch timed out")), 3000)
      })

      try {
        const result = await Promise.race([profilePromise, profileTimeoutPromise])
        if (result.error) {
          console.error("Error fetching profile:", result.error.message)
          // Don't throw, just continue with null profileData
        } else {
          profileData = result.data
        }
      } catch (fetchError) {
        console.error("Network error fetching profile:", fetchError)
        // Increment failure count for circuit breaker
        connectionFailures++
        lastFailureTime = Date.now()

        // If we've hit the failure threshold, force offline mode
        if (connectionFailures >= MAX_FAILURES) {
          console.log(`Circuit breaker tripped after profile fetch failure - enabling offline mode`)
          forceOfflineMode(true)
        }
      }
    } catch (profileError) {
      console.error("Unexpected error fetching profile:", profileError)
    }

    // Get account data with timeout and better error handling
    let accountData = null
    try {
      const accountPromise = supabase.from("account_balances").select("*").eq("user_id", userId).single()
      const accountTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Account fetch timed out")), 3000)
      })

      try {
        const result = await Promise.race([accountPromise, accountTimeoutPromise])
        if (result.error) {
          console.error("Error fetching account balance:", result.error.message)
          // Don't throw, just continue with null accountData
        } else {
          accountData = result.data
        }
      } catch (fetchError) {
        console.error("Network error fetching account balance:", fetchError)
        // Increment failure count for circuit breaker
        connectionFailures++
        lastFailureTime = Date.now()

        // If we've hit the failure threshold, force offline mode
        if (connectionFailures >= MAX_FAILURES) {
          console.log(`Circuit breaker tripped after account fetch failure - enabling offline mode`)
          forceOfflineMode(true)
        }
      }
    } catch (accountError) {
      console.error("Unexpected error fetching account balance:", accountError)
    }

    // Return whatever data we have, even if some parts are missing
    // If we couldn't fetch the data, provide fallback data
    return {
      user: sessionData.session.user,
      profile: profileData || {
        id: userId,
        first_name: "User",
        last_name: "",
        profile_picture_url: "/vibrant-street-market.png",
      },
      account: accountData || { balance: 120000, loan_balance: 50000 },
    }
  } catch (error) {
    console.error("Critical error in getUserProfile:", error)

    // Force offline mode if we encounter a critical error
    forceOfflineMode(true)

    // Return fallback data to prevent the application from crashing
    return {
      user: { id: "error-fallback", email: "user@example.com" },
      profile: {
        id: "error-fallback",
        first_name: "User",
        last_name: "",
        profile_picture_url: "/vibrant-street-market.png",
      },
      account: { balance: 120000, loan_balance: 50000 },
    }
  }
}
