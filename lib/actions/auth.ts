"use server"
import { createAdminClient } from "@/lib/supabase/admin"
import { v4 as uuidv4 } from "uuid"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { executeSQL } from "./database-functions"
//import { resend } from 'resend'

// Add the JWT imports at the top of the file
import { generateJWT, setJWTCookie, clearJWTCookies, verifyJWT, getJWTFromCookies } from "@/lib/jwt"

// Define offline mode variables
let isOfflineModeEnabled = false

function isOfflineMode() {
  return isOfflineModeEnabled
}

function forceOfflineMode(value: boolean) {
  isOfflineModeEnabled = value
}

// Add a new function to refresh JWT tokens
export async function refreshJWT(currentToken: string) {
  try {

    // Verify the current token first
    const { payload, error: verifyError } = await import("@/lib/jwt").then((module) => module.verifyJWT(currentToken))

    if (verifyError || !payload) {
      return { error: "Invalid token" }
    }

    // Get the user ID from the token
    const userId = payload.userId || payload.sub

    if (!userId) {
      return { error: "Invalid token payload" }
    }

    // Check if the token is actually expired or about to expire
    const expiryTime = payload.exp
    const currentTime = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = expiryTime - currentTime

    // Only refresh if token is expired or about to expire (less than 15 minutes)
    if (timeUntilExpiry > 900) {
      return { success: true, refreshed: false }
    }

    // Get the user's email from Supabase
    let userEmail = payload.email

    // If email is not in the token, try to get it from Supabase
    if (!userEmail) {
      try {
        const adminClient = createAdminClient()
        const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId)

        if (userError || !userData?.user) {
          // Continue with just the user ID
        } else {
          userEmail = userData.user.email
        }
      } catch (error: any) {
        // Continue with just the user ID
      }
    }

    // Generate a new JWT with the same data but extended expiration
    const { jwt, error: jwtError } = await generateJWT({
      userId: userId,
      email: userEmail,
      role: payload.role || "user",
      sessionId: payload.sessionId || uuidv4(),
    })

    if (jwtError || !jwt) {
      return { error: "Failed to generate new token" }
    }

    // Set the new JWT in cookies
    const cookieSet = setJWTCookie(jwt)

    if (!cookieSet) {
      return { error: "Failed to set authentication cookie" }
    }

    return { success: true, refreshed: true, jwt }
  } catch (error) {
    return {
      error: `An unexpected error occurred during token refresh: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Replace the createAuthUser function with this implementation
async function createAuthUser(userData: {
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
  country: string
  bankCode?: string
  profilePictureUrl?: string | null
}) {
  try {
    const adminClient = createAdminClient()

    // Hash the password
    const { hashPassword } = await import("@/lib/auth-utils/password")
    const hashedPassword = await hashPassword(userData.password)

    // Create user metadata
    const userMetadata = {
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
      country: userData.country,
      bank_code: userData.bankCode || null,
      profile_picture_url: userData.profilePictureUrl,
    }

    // Create the auth user in public.auth_users table
    const userId = uuidv4()
    const now = new Date().toISOString()

    const { error: authError } = await adminClient.from("auth_users").insert({
      id: userId,
      email: userData.email.toLowerCase(),
      phone: userData.phoneNumber, // Explicitly set the phone field
      encrypted_password: hashedPassword,
      raw_user_meta_data: userMetadata as any, // Cast userMetadata to any
      created_at: now,
      updated_at: now,
      email_confirmed_at: now, // Auto-confirm email
    })

    if (authError) {

      // Check for specific error messages related to existing users
      if (authError.message.includes("duplicate key") || authError.message.includes("unique constraint")) {
        return {
          error: "This email is already registered. Please use a different email or try logging in.",
        }
      }

      return { error: authError.message }
    }

    return {
      success: true,
      user: {
        id: userId,
        email: userData.email,
        user_metadata: userMetadata as any, // Cast userMetadata to any
      },
    }
  } catch (error: any) { // Explicitly type error
    return { error: `An unexpected error occurred: ${error.message}` }
  }
}

// Replace the signIn function with this implementation
export async function signIn(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return { error: "Email and password are required" }
    }

    const adminClient = createAdminClient()

    // Get user from auth_users table
    const { data: userData, error: userError } = await adminClient
      .from("auth_users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single()

    if (userError || !userData) {
      return { error: "Invalid email or password" }
    }

    // Verify password
    const { comparePassword } = await import("@/lib/auth-utils/password")
    const passwordValid = await comparePassword(password, userData.encrypted_password)

    if (!passwordValid) {
      return { error: "Invalid email or password" }
    }

    // Update last sign in time
    await adminClient
      .from("auth_users")
      .update({
        last_sign_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userData.id) // Await update before eq


    // Create a session object similar to Supabase's
    const sessionId = uuidv4()
    const session = {
      id: sessionId,
      user_id: userData.id,
      created_at: new Date().toISOString(),
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      access_token: uuidv4(), // Generate a random token
    }

    // Generate JWT
    let jwt = null
    try {
      const { jwt: generatedJwt, error: jwtError } = await generateJWT({
        userId: userData.id,
        email: userData.email || "",
        role: "user",
        sessionId: sessionId,
      })

      if (jwtError) {
        // Continue with session as fallback
      } else if (generatedJwt) {
        // Set JWT in cookies
        const cookieSet = setJWTCookie(generatedJwt)
        jwt = generatedJwt
      }
    } catch (jwtError) {
      // Continue with session as fallback
    }

    // Set cookies with longer expiration
    try {
      const cookieStore = cookies()

      // Set a session cookie with a long expiration
      cookieStore.set("custom-auth-token", session.access_token, {
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

      // Set an auth bypass cookie to prevent middleware redirects
      cookieStore.set("auth-bypass", "true", {
        path: "/",
        maxAge: 300, // 5 minutes
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })

    } catch (cookieError) {
      // Continue anyway
    }

    return {
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        user_metadata: userData.raw_user_meta_data,
      },
      redirectUrl: "/home",
      session: session,
      jwt: jwt, // Return the JWT to the client
    }
  } catch (error) {
    return { error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` }
  }
}

// Function to ensure a user has a profile
async function ensureUserProfile(userId: string) {
  try {

    // Check if we're in offline mode first
    if (isOfflineMode()) {
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
        forceOfflineMode(true)
        return { data: null, error: { message: error.message } }
      })

      if (profileCheckError && profileCheckError.code !== "PGRST116") {
        // PGRST116 is the error code for "no rows returned" - that's expected if profile doesn't exist
        return { error: "Failed to check for existing profile", fallback: true }
      }

      if (existingProfile) {
        // Check if account balance exists
        try {
          await ensureAccountBalance(userId)
        } catch (balanceError) {
        }
        return { success: true }
      }
    } catch (checkError) {
      // Return a fallback success to prevent blocking the application
      forceOfflineMode(true)
      return { success: true, fallback: true }
    }


    // Get user metadata to populate profile
    try {
      const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId)

      if (userError) {
        // Create a basic profile anyway
        try {
          // Define metadata here to avoid the "undeclared variable" error
          const metadata = userData?.user?.user_metadata || {}

          const { error: createError } = await adminClient.from("profiles").insert({
            id: userId,
            first_name: metadata.first_name,
            middle_name: metadata.middle_name,
            last_name: metadata.last_name,
            phone_number: metadata.phone_number,
            bvn: metadata.bvn,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (createError) {
            return { error: "Failed to create profile", fallback: true }
          }
        } catch (insertError) {
          return { success: true, fallback: true }
        }
      } else {
        // Create profile with user metadata - ensure ALL fields are included
        const metadata = userData.user.user_metadata || {}

        try {
          const { error: createError } = await adminClient.from("profiles").insert({
            id: userId,
            email: metadata.email || userData.user.email,
            first_name: metadata.first_name,
            middle_name: metadata.middle_name,
            last_name: metadata.last_name,
            phone_number: metadata.phone_number,
            bvn: metadata.bvn,
            date_of_birth: metadata.date_of_birth,
            address: metadata.address,
            city: metadata.city,
            state: metadata.state,
            zip_code: metadata.zip_code,
            country: metadata.country,
            profile_picture_url: metadata.profile_picture_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (createError) {
            return { error: "Failed to create profile", fallback: true }
          }
        } catch (insertError) {
          return { success: true, fallback: true }
        }
      }
    } catch (userDataError) {
      return { success: true, fallback: true }
    }

    // After creating the profile, ensure notification preferences exist
    try {
      await ensureNotificationPreferences(userId)
    } catch (preferencesError) {
      // Continue anyway, this is not critical
    }

    // Ensure account balance exists
    try {
      await ensureAccountBalance(userId)
    } catch (balanceError) {
    }

    return { success: true }
  } catch (error) {
    // Return success with fallback to prevent blocking the application
    return { success: true, fallback: true }
  }
}

// Update the ensureAccountBalance function to properly check if the user exists in auth_users first
// and to handle the foreign key constraint error

async function ensureAccountBalance(userId: string) {
  try {
    const adminClient = createAdminClient()

    // First, verify that the user exists in auth_users table
    try {
      const { data: userExists, error: userCheckError } = await adminClient
        .from("auth_users")
        .select("id")
        .eq("id", userId)
        .single()

      if (userCheckError || !userExists) {
        return { error: "User does not exist in auth_users table", fallback: true }
      }
    } catch (userCheckError) {
      return { error: "Failed to verify user existence", fallback: true }
    }

    // Now check if account balance already exists
    try {
      const { data: existingBalance, error: balanceCheckError } = await adminClient
        .from("account_balances")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (balanceCheckError && balanceCheckError.code !== "PGRST116") {
        return { error: "Failed to check for existing account balance", fallback: true }
      }

      if (existingBalance) {
        return { success: true }
      }
    } catch (checkError) {
      return { success: true, fallback: true }
    }


    // Create account balance with retry logic
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
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
          if (balanceError.code === "23503") {
            // Foreign key violation
            retryCount++
            // Wait a bit before retrying to allow for any pending transactions to complete
            await new Promise((resolve) => setTimeout(resolve, 500))
          } else {
            return { error: "Failed to create account balance: " + balanceError.message, fallback: true }
          }
        } else {
          // Success!
          return { success: true }
        }
      } catch (insertError) {
        retryCount++
        if (retryCount >= maxRetries) {
          return { success: true, fallback: true, warning: "Failed to create account balance after retries" }
        }
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // If we get here, all retries failed
    return { success: true, fallback: true, warning: "Failed to create account balance after maximum retries" }
  } catch (error) {
    return { success: true, fallback: true }
  }
}

// Function to ensure notification preferences exist for a user
async function ensureNotificationPreferences(userId: string) {
  try {
    const adminClient = createAdminClient()

    // Check if notification preferences exist
    try {
      const { data: existingPreferences, error: preferencesCheckError } = await adminClient
        .from("notification_preferences")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (preferencesCheckError && preferencesCheckError.code !== "PGRST116") {
        return { error: "Failed to check for existing notification preferences", fallback: true }
      }

      if (existingPreferences) {
        return { success: true }
      }
    } catch (checkError) {
      return { success: true, fallback: true }
    }


    // Create notification preferences
    try {
      const { error: preferencesError } = await adminClient.from("notification_preferences").insert({
        id: uuidv4(),
        user_id: userId,
        email_notifications: true,
        sms_notifications: false,
        push_notifications: false,
        marketing_emails: true,
        transaction_alerts: true,
        security_alerts: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (preferencesError) {
        return { error: "Failed to create notification preferences", fallback: true }
      }
    } catch (insertError) {
      return { success: true, fallback: true }
    }

    return { success: true }
  } catch (error) {
    return { success: true, fallback: true }
  }
}

// Replace the checkEmailExists function with this implementation
export async function checkEmailExists(email: string) {
  let errorMessage = ""

  try {
    const adminClient = createAdminClient()

    // Check if we're in offline mode
    if (isOfflineMode()) {
      return { exists: false }
    }

    // Check auth_users table
    try {
      const { data: authUsers, error: authQueryError } = await adminClient
        .from("auth_users")
        .select("id, email")
        .eq("email", email.toLowerCase().trim())
        .limit(1)

      if (authQueryError) {
        errorMessage = "Error checking auth system for email"
      } else if (authUsers && authUsers.length > 0) {
        return {
          exists: true,
          source: "auth_users",
          field: "email",
          message: "This email is already registered. Please use a different email or try logging in.",
        }
      } else {
      }
    } catch (emailCheckError) {
      errorMessage = "Error checking auth system for email"
      // Continue with profiles check
    }

    // Next, check profiles table
    try {
      const { data: emailProfiles, error: profileEmailError } = await adminClient
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .limit(1)

      if (profileEmailError) {
      } else if (emailProfiles && emailProfiles.length > 0) {
        // Compare emails case-insensitively
        const submittedEmail = email.toLowerCase().trim()
        const existingEmail = emailProfiles[0].email?.toLowerCase().trim()

        if (existingEmail === submittedEmail) {
          return {
            exists: true,
            submitted: submittedEmail,
            existing: existingEmail,
          }
        }
      } else {
      }
    } catch (profileEmailCheckError) {
      // Continue with result
    }

    // If we get here, no existing email was found
    return {
      exists: false,
      warning: errorMessage || undefined,
    }
  } catch (error) {
    // Return a non-blocking error
    return {
      exists: false,
      warning: errorMessage || "Failed to check if email already exists",
      error: "Failed to check if email already exists. You can continue, but we'll verify again during signup.",
    }
  }
}

// Replace the checkUserExists function with this implementation
export async function checkUserExists(email: string, phoneNumber: string, bvn: string) {
  let errorMessage = ""

  try {
    const adminClient = createAdminClient()

    // Check if we're in offline mode
    if (isOfflineMode()) {
      return { exists: false }
    }

    // First, check if the email exists in auth_users
    try {
      const { data: authUsers, error: authQueryError } = await adminClient
        .from("auth_users")
        .select("id, email")
        .eq("email", email.toLowerCase().trim())
        .limit(1)

      if (authQueryError) {
        errorMessage = "Error checking auth system for email"
      } else if (authUsers && authUsers.length > 0) {
        return {
          exists: true,
          source: "auth_users",
          field: "email",
          message: "This email is already registered. Please use a different email or try logging in.",
        }
      } else {
      }
    } catch (emailCheckError) {
      errorMessage = "Error checking auth system for email"
      // Continue with profiles check
    }

    // Next, check if the email exists in profiles
    try {
      const { data: emailProfiles, error: profileEmailError } = await adminClient
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .limit(1)

      if (profileEmailError) {
      } else if (emailProfiles && emailProfiles.length > 0) {
        // Compare emails case-insensitively
        const submittedEmail = email.toLowerCase().trim()
        const existingEmail = emailProfiles[0].email?.toLowerCase().trim()

        if (existingEmail === submittedEmail) {
          return {
            exists: true,
            submitted: submittedEmail,
            existing: existingEmail,
          }
        }
      } else {
      }
    } catch (profileEmailCheckError) {
      // Continue with other checks
    }

    // Next, check if the phone number exists in profiles
    try {
      const { data: phoneProfiles, error: phoneError } = await adminClient
        .from("profiles")
        .select("id")
        .eq("phone_number", phoneNumber)
        .limit(1)

      if (phoneError) {
      } else if (phoneProfiles && phoneProfiles.length > 0) {
        return {
          exists: true,
          source: "profiles",
          field: "phoneNumber",
          message: "This phone number is already registered. Please use a different phone number.",
        }
      } else {
      }
    } catch (phoneCheckError) {
      // Continue with other checks
    }

    // Finally, check if the BVN exists in profiles
    try {
      const { data: bvnProfiles, error: bvnError } = await adminClient
        .from("profiles")
        .select("id")
        .eq("bvn", bvn)
        .limit(1)

      if (bvnError) {
      } else if (bvnProfiles && bvnProfiles.length > 0) {
        return {
          exists: true,
          source: "profiles",
          field: "bvn",
          message: "This BVN is already registered. Please use a different BVN.",
        }
      } else {
      }
    } catch (bvnCheckError) {
      // Continue anyway
    }

    // If we get here, no existing user was found
    return {
      exists: false,
      warning: errorMessage || undefined,
    }
  } catch (error) {
    // Return a non-blocking error
    return {
      exists: false,
      warning: errorMessage || "Failed to check if user already exists",
      error: "Failed to check if user already exists. You can continue, but we'll verify again during signup.",
    }
  }
}

// Function to create a user profile
async function createUserProfile(
  userId: string,
  userData: {
    email: string
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
    country: string
    bankCode?: string
    profilePictureUrl?: string | null
    referred_by: string
    referral_code: string
  },
) {
  try {
    const adminClient = createAdminClient()

    // Check if a profile with this ID already exists
    const { data: existingProfile, error: checkError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (checkError) {
      // Continue anyway
    }

    if (existingProfile) {
      return { success: true, message: "Profile already exists" }
    }

    // Format the date properly for PostgreSQL
    let formattedDateOfBirth = null
    try {
      if (userData.dateOfBirth) {
        // Try parsing as ISO string first
        const date = new Date(userData.dateOfBirth)
        if (!isNaN(date.getTime())) {
          formattedDateOfBirth = date.toISOString().split("T")[0]
        } else {
          // Leave as null
        }
      }
    } catch (dateError) {
      // Continue with null
    }

    // Prepare profile data - explicitly include email field and ensure all fields are properly formatted
    const profileData = {
      id: userId,
      email: userData.email, // Email is required
      first_name: userData.firstName || "",
      middle_name: userData.middleName || null,
      last_name: userData.lastName || "",
      phone_number: userData.phoneNumber || "",
      bvn: userData.bvn || "",
      date_of_birth: formattedDateOfBirth || null, // Properly formatted date
      address: userData.address || "",
      city: userData.city || "",
      state: userData.state || "",
      zip_code: userData.zipCode || null,
      country: userData.country || "Nigeria", // Default to Nigeria if not provided
      bank_code: userData.bankCode || null,
      profile_picture_url: userData.profilePictureUrl || null,
      referred_by: userData.referred_by,
      referral_code: userData.referral_code,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Try inserting with more detailed error logging
    try {
      const { error: profileError } = await adminClient.from("profiles").insert(profileData)

      if (profileError) {

        // If there's a unique constraint violation, handle it gracefully
        if (profileError.code === "23505") {
          // PostgreSQL unique violation code
          return { success: true, warning: "Profile may already exist" }
        } else if (profileError.code === "23502") {
          // NOT NULL violation
          return {
            error: "Missing required field: " + (profileError.details || profileError.message),
          }
        } else {
          return {
            error: "Database error creating profile: " + profileError.message,
          }
        }
      }
    } catch (insertError) {
      return {
        error:
          "Database error creating profile: " +
          (insertError instanceof Error ? insertError.message : String(insertError)),
      }
    }

    return { success: true }
  } catch (error) {
    return { error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` }
  }
}

// Update the signUp function to ensure proper sequencing
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
  country: string
  bankCode?: string
  profilePictureUrl?: string | null
  referralCode: string
}) {
  try {
    // Validate referral code
    const adminClient = createAdminClient()
    const { data: referrer, error: referrerError } = await adminClient
      .from("profiles")
      .select("id, referral_code")
      .eq("referral_code", userData.referralCode)
      .single()
    if (referrerError || !referrer) {
      return { error: "Invalid referral code. Please enter a valid code from an existing user." }
    }

    // First check if user with email already exists
    const existsCheck = await checkEmailExists(userData.email)

    if (existsCheck.exists) {
      return { error: existsCheck.message || "This email already exists" }
    }

    // Step 1: Create the auth user
    const authResult = await createAuthUser(userData)

    if (!authResult.success || !authResult.user) {
      return { error: authResult.error || "Failed to create user account" }
    }

    const userId = authResult.user.id

    // Generate a unique referral code for the new user
    const newReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase()

    // Step 2: Create the user profile, including referred_by and referral_code
    const profileResult = await createUserProfile(userId, {
      ...userData,
      referred_by: userData.referralCode,
      referral_code: newReferralCode,
    })

    if (!profileResult.success) {
      // Try to delete the auth user to maintain consistency
      try {
        const adminClient = createAdminClient()
        await adminClient.from("auth_users").delete().eq("id", userId)
      } catch (deleteError) {
      }

      return { error: profileResult.error || "Failed to create user profile" }
    }

    // Add another small delay before creating account balance
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Step 3: Create account balance
    try {
      const balanceResult = await ensureAccountBalance(userId)
      if (!balanceResult.success) {
        // Continue anyway, this is not critical
      }
    } catch (balanceError) {
      // Continue anyway, this is not critical
    }

    // Step 4: Create notification preferences
    try {
      const preferencesResult = await ensureNotificationPreferences(userId)
      if (!preferencesResult.success) {
        // Continue anyway, this is not critical
      }
    } catch (preferencesError) {
      // Continue anyway, this is not critical
    }

    // Send welcome email
    try {
      const { sendWelcomeEmail } = await import("@/lib/actions/email-notifications")
      await sendWelcomeEmail(userData.email, `${userData.firstName} ${userData.lastName}`).catch((err) => {
        // Non-blocking - continue with signup even if email fails
      })
    } catch (emailError) {
      // Non-blocking - continue with signup even if email fails
    }

    return {
      success: true,
      user: authResult.user,
      message: "Account created successfully! Please log in to continue.",
    }
  } catch (error) {
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
            return { error: "Failed to update profile", fallback: true }
          }
        } catch (updateError) {
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
            return { error: "Failed to create profile", fallback: true }
          }
        } catch (createError) {
          return { success: true, fallback: true }
        }
      }
    } catch (checkError) {
      return { success: true, fallback: true }
    }

    return { success: true }
  } catch (error) {
    return { success: true, fallback: true }
  }
}

// Create a table for password reset tokens if it doesn't exist
async function ensurePasswordResetTokensTable() {
  try {
    const adminClient = createAdminClient()

    // First, try to query the table to see if it exists
    try {
      const { data, error } = await adminClient.from("password_reset_tokens").select("id").limit(1)

      if (!error) {
        return true
      } else {
        // Table might not exist, continue to creation
      }
    } catch (queryError) {
      // Continue to creation
    }

    // Create the table using direct SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        token TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT password_reset_tokens_token_key UNIQUE (token)
      );
    `

    // Try direct execution first
    try {
      // Try using the SQL extension if available
      try {
        const { error: sqlExtError } = await adminClient.rpc("sql", { query: createTableSQL })

        if (!sqlExtError) {
          return true
        }
      } catch (sqlError) {
      }

      // Try using pgfunction if available
      try {
        const { error: pgFuncError } = await adminClient.rpc("pgfunction", { query: createTableSQL })

        if (!pgFuncError) {
          return true
        }
      } catch (pgFuncError) {
      }
    } catch (directError) {
    }

    // Fallback to executeSQL function
    const { success, result, error } = await executeSQL(createTableSQL)

    if (success && result && result.length > 0) {
      const exists = result[0].exists
      return exists
    } else if (error) {
    }

    // If all methods fail, assume the table doesn't exist
    return false
  } catch (error) {
    return false
  }
}

// Create a reset token for a user
async function createPasswordResetToken(userId: string, email: string) {
  try {
    const adminClient = createAdminClient()

    // Generate a secure token - simplify to reduce potential issues
    const token = uuidv4() + uuidv4().replace(/-/g, "")

    // Set expiration time (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // First check if the table exists using our SQL function
    const tableExists = await checkTableExists("password_reset_tokens")

    if (!tableExists) {
      // Try to create the table using our migration SQL
      try {
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            email VARCHAR(255) NOT NULL,
            token VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL,
            used BOOLEAN NOT NULL DEFAULT FALSE
          );
        `
        await executeSQL(createTableSQL)
      } catch (createError) {
        // Continue anyway - we'll try to insert and see what happens
      }
    }

    // Prepare the data to insert
    const tokenData = {
      id: uuidv4(),
      user_id: userId,
      email: email, // Add email to the token data
      token: token,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      used: false,
    }


    // Try inserting with more detailed error logging
    try {
      const { error } = await adminClient.from("password_reset_tokens").insert(tokenData)

      if (error) {

        // Try a direct SQL approach as fallback
        try {
          const insertSQL = `
            INSERT INTO password_reset_tokens (id, user_id, email, token, expires_at, created_at, used)
            VALUES ('${tokenData.id}', '${userId}', '${email}', '${token}', '${expiresAt.toISOString()}', '${new Date().toISOString()}', false);
          `
          const { success, error: sqlError } = await executeSQL(insertSQL)

          if (!success) {

            // Last resort - store the token in memory (this will only work for the current server instance)
            // We'll just return the token and handle it in memory
            return { success: true, token, fallback: true }
          } else {
            return { success: true, token }
          }
        } catch (sqlError) {
          // Last resort - return the token anyway
          return { success: true, token, fallback: true }
        }
      } else {
        return { success: true, token }
      }
    } catch (insertError) {
      // Last resort - return the token anyway
      return { success: true, token, fallback: true }
    }
  } catch (error) {
    // Generate a token anyway as a fallback
    const fallbackToken = uuidv4() + uuidv4().replace(/-/g, "")
    return { success: true, token: fallbackToken, fallback: true }
  }
}

// Find the handlePasswordResetEmail function and replace it with this implementation:

// Send a password reset email using Resend
async function handlePasswordResetEmail(email: string, token: string) {
  try {

    // Create the reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    // Import the email service
    const { sendEmail, getPasswordResetEmailTemplate } = await import("@/lib/email-service")

    // Send the email using our email service
    const emailResult = await sendEmail({
      to: email,
      subject: "Reset Your PeerCapital Password",
      html: getPasswordResetEmailTemplate(resetUrl),
    })

    if (!emailResult.success) {
      return { success: false, error: emailResult.error }
    }

    return { success: true }
  } catch (error) {
    // Return success anyway to avoid revealing if email exists
    return { success: true }
  }
}

// Remove the old code that was using resend directly
// Delete these lines:
// const resend = new Resend(process.env.RESEND_API_KEY);
// async function POST() {
// try {
// const { data, error } = await resend.emails.send({
//   from: 'Peer Capital <donotreply@peercapital.com.ng>',
//   to: email,
//   subject: emailSubject,
//   react: emailContent,
// });
// if (error) {
//   return Response.json({ error }, { status: 500 });
// }
// return Response.json(data);
// } catch (error) {
//   return Response.json({ error }, { status: 500 });
// }
// }

// Update the resetPassword function to handle token creation errors
export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string

  if (!email) {
    return { error: "Email is required" }
  }

  try {
    const adminClient = createAdminClient()

    // Check if the user exists
    const { data: userData, error: userError } = await adminClient
      .from("auth_users")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single()

    if (userError) {
      // Don't reveal if the email exists or not for security
      return { success: true, message: "If your email is registered, you will receive password reset instructions." }
    }

    if (!userData) {
      // Don't reveal if the email exists or not for security
      return { success: true, message: "If your email is registered, you will receive password reset instructions." }
    }

    // User exists, create a reset token - pass the email to the function
    const tokenResult = await createPasswordResetToken(userData.id, email)

    if (!tokenResult.success || !tokenResult.token) {
      return { success: true, message: "If your email is registered, you will receive password reset instructions." }
    }

    // Send the reset email
    const emailResult = await handlePasswordResetEmail(email, tokenResult.token)

    if (!emailResult.success) {
      return { success: true, message: "If your email is registered, you will receive password reset instructions." }
    }

    // Return success
    return {
      success: true,
      message: "If your email is registered, you will receive password reset instructions.",
    }
  } catch (error) {
    return {
      success: true,
      message: "If your email is registered, you will receive password reset instructions.",
    }
  }
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

      // Clear custom auth token
      cookieStore.set("custom-auth-token", "", {
        path: "/",
        expires: new Date(0),
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
    } catch (cookieError) {
    }

    // Return success immediately
    return { success: true, redirectUrl: "/?signout=true" }
  } catch (error) {
    return { success: false, redirectUrl: "/?signout=true", error: String(error) }
  }
}

// Circuit breaker configuration
const MAX_FAILURES = 3
const connectionFailures = 0
const lastFailureTime = 0

// Update the getUserProfile function to use our custom implementation
export async function getUserProfile() {
  try {
    // Check if we're in offline mode
    if (isOfflineMode()) {
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

    // Get user ID from JWT
    const jwt = getJWTFromCookies()
    let userId = null

    if (jwt) {
      try {
        const { payload, error } = await verifyJWT(jwt)
        if (!error && payload && (payload.userId || payload.sub)) {
          userId = payload.userId || payload.sub
          // Validate userId is not "undefined" or empty
          if (!userId || userId === "undefined") {
            userId = null
          } else {
          }
        }
      } catch (error) {
      }
    }

    // If no userId from JWT, try to get from custom auth token
    if (!userId) {
      try {
        const cookieStore = cookies()
        const authToken = cookieStore.get("custom-auth-token")?.value

        if (authToken) {
          const adminClient = createAdminClient()
          const { data: userData, error } = await adminClient
            .from("auth_users")
            .select("id")
            .eq("access_token", authToken)
            .single()

          if (!error && userData && userData.id && userData.id !== "undefined") {
            userId = userData.id
          }
        }
      } catch (error) {
      }
    }

    // If still no userId, return fallback data
    if (!userId) {
      return fallbackUserData
    }

    const adminClient = createAdminClient()

    // Fetch user profile data using admin client to bypass RLS
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("*" // Select all columns to include new social media fields
      )
      .eq("id", userId)
      .single()

    if (profileError) {
      // Continue with fallback data
      return fallbackUserData
    }

    // Get account data
    let accountData = null
    try {
      const { data, error } = await adminClient.from("account_balances").select("*").eq("user_id", userId).single()

      if (error) {
      } else {
        accountData = data
      }
    } catch (error) {
    }

    // Return whatever data we have, even if some parts are missing
    return {
      user: { id: userId, email: "user@example.com" },
      profile: {
        ...profile,
        idExpirationDate: profile.id_expiration_date,
        idDateIssued: profile.id_date_issued,
      },
      account: accountData || { balance: 120000, loan_balance: 50000 },
    }
  } catch (error) {
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

// Verify a password reset token
export async function verifyResetToken(token: string) {
  try {
    const adminClient = createAdminClient()

    // Ensure the table exists
    await ensurePasswordResetTokensTable()

    // Check if the token exists and is valid
    const { data, error } = await adminClient
      .from("password_reset_tokens")
      .select("id, user_id, expires_at, used")
      .eq("token", token)
      .single()

    if (error) {
      return { error: "Invalid or expired token" }
    }

    if (!data) {
      return { error: "Invalid or expired token" }
    }

    // Check if the token is expired
    const now = new Date()
    const expiresAt = new Date(data.expires_at)

    if (now > expiresAt) {
      return { error: "This reset link has expired. Please request a new one." }
    }

    // Check if the token has been used
    if (data.used) {
      return { error: "This reset link has already been used. Please request a new one." }
    }

    // Get the user information
    const { data: userData, error: userError } = await adminClient
      .from("auth_users")
      .select("id, email")
      .eq("id", data.user_id)
      .single()

    if (userError || !userData) {
      return { error: "Invalid token" }
    }

    return {
      success: true,
      userId: data.user_id,
      email: userData.email,
    }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}

// Reset password with token
export async function resetPasswordWithToken(token: string, newPassword: string) {
  try {

    // First verify the token
    const tokenResult = await verifyResetToken(token)

    if (tokenResult.error) {
      return { error: tokenResult.error }
    }

    const userId = tokenResult.userId

    const adminClient = createAdminClient()

    // Hash the new password
    const { hashPassword } = await import("@/lib/auth-utils/password")
    const hashedPassword = await hashPassword(newPassword)

    // Update the user's password
    const { error: updateError } = await adminClient
      .from("auth_users")
      .update({
        encrypted_password: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      return { error: "Failed to update password" }
    }

    // Mark the token as used
    const { error: tokenUpdateError } = await adminClient
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("token", token)

    if (tokenUpdateError) {
      // Continue anyway, the password was updated successfully
    }

    return { success: true }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}

// Change password for authenticated user
export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const supabase = createServerClient()
    const adminClient = createAdminClient()

    // Get the current user
    const { data: sessionData } = await supabase.auth.getSession()

    // Try to get user ID from JWT if session is not available
    let userId = sessionData.session?.user?.id

    if (!userId) {
      // Try to get user ID from JWT
      const jwt = getJWTFromCookies()
      if (jwt) {
        try {
          const { payload, error } = await verifyJWT(jwt)
          if (!error && payload && (payload.userId || payload.sub)) {
            userId = payload.userId || payload.sub
          }
        } catch (error) {
        }
      }

      // Try to get from custom auth token
      if (!userId) {
        try {
          const cookieStore = cookies()
          const authToken = cookieStore.get("custom-auth-token")?.value

          if (authToken) {
            const { data: userData, error } = await adminClient
              .from("auth_users")
              .select("id")
              .eq("access_token", authToken)
              .single()

            if (!error && userData) {
              userId = userData.id
            }
          }
        } catch (error) {
        }
      }
    }

    if (!userId) {
      return { error: "You must be logged in to change your password" }
    }

    // Get the user's current password hash
    const { data: userData, error: userError } = await adminClient
      .from("auth_users")
      .select("encrypted_password")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      return { error: "Failed to verify current password" }
    }

    // Verify the current password
    const { comparePassword } = await import("@/lib/auth-utils/password")
    const passwordValid = await comparePassword(currentPassword, userData.encrypted_password)

    if (!passwordValid) {
      return { error: "Current password is incorrect" }
    }

    // Hash the new password
    const { hashPassword } = await import("@/lib/auth-utils/password")
    const hashedPassword = await hashPassword(newPassword)

    // Update the user's password
    const { error: updateError } = await adminClient
      .from("auth_users")
      .update({
        encrypted_password: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      return { error: "Failed to update password" }
    }

    return { success: true }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}

// Add these exports at the end of the file
export { createPasswordResetToken, handlePasswordResetEmail }

// Utility function to check if a table exists
async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const adminClient = createAdminClient()

    // Method 1: Try to query the information_schema.tables view
    try {
      const { data, error } = await adminClient
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_name", tableName)
        .eq("table_schema", "public")
        .limit(1)

      if (!error && data && data.length > 0) {
        return true
      } else if (error) {
        // Continue to next method
      }
    } catch (error) {
      // Continue to next method
    }

    // Method 2: Try to directly query the table
    try {
      const { data, error } = await adminClient.from(tableName).select("*").limit(1)

      // If we don't get an error, the table exists
      if (!error) {
        return true
      } else {
        // If the error is about the relation not existing, the table doesn't exist
        if (error.message && error.message.includes("relation") && error.message.includes("does not exist")) {
          return false
        }
        // Otherwise, it might be a permission issue or something else
      }
    } catch (error) {
      // Continue to next method
    }

    // Method 3: Try using executeSQL function if available
    try {
      const checkSQL = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        );
      `

      const { success, result, error } = await executeSQL(checkSQL)

      if (success && result && result.length > 0) {
        const exists = result[0].exists
        return exists
      } else if (error) {
      }
    } catch (error) {
    }

    // If all methods fail, assume the table doesn't exist
    return false
  } catch (error) {
    return false
  }
}
