"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

// Update the updateProfile function to use multiple authentication methods
export async function updateProfile({
  firstName,
  middleName,
  lastName,
  phoneNumber,
  address,
  city,
  state,
  zipCode,
  profilePictureUrl,
  bvn,
  dateOfBirth,
}: {
  firstName: string
  middleName?: string
  lastName: string
  phoneNumber: string
  address: string
  city: string
  state: string
  zipCode?: string
  profilePictureUrl?: string | null
  bvn?: string
  dateOfBirth?: string
}) {
  try {
    const supabase = createServerClient()
    const adminClient = createAdminClient()

    // Try multiple methods to get the user ID
    let userId = null

    // Method 1: Try to get user from Supabase session
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session?.user) {
        userId = sessionData.session.user.id
        console.log("Using user ID from Supabase session for profile update:", userId)
      }
    } catch (sessionError) {
      console.error("Error getting session for profile update:", sessionError)
      // Continue to next method
    }

    // Method 2: Try to get user from JWT if session failed
    if (!userId) {
      try {
        const { getJWTFromCookies, verifyJWT } = await import("@/lib/jwt")
        const jwt = getJWTFromCookies()
        if (jwt) {
          const { payload, error } = await verifyJWT(jwt)
          if (!error && payload && (payload.userId || payload.sub)) {
            userId = payload.userId || payload.sub
            console.log("Using user ID from JWT for profile update:", userId)
          }
        }
      } catch (jwtError) {
        console.error("Error verifying JWT for profile update:", jwtError)
        // Continue to next method
      }
    }

    // If we still don't have a user ID, return an error
    if (!userId) {
      console.error("No authenticated user found for profile update")
      return { error: "Authentication failed. Please try logging in again." }
    }

    // Update the profile using admin client to bypass RLS
    const { error } = await adminClient
      .from("profiles")
      .update({
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        phone_number: phoneNumber,
        address: address,
        city: city,
        state: state,
        zip_code: zipCode || null,
        profile_picture_url: profilePictureUrl || null,
        // Only update BVN and date_of_birth if they are provided
        ...(bvn ? { bvn } : {}),
        ...(dateOfBirth ? { date_of_birth: dateOfBirth } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("Error updating profile:", error)
      return { error: error.message }
    }

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error updating profile:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Update the uploadProfilePicture function to use multiple authentication methods
export async function uploadProfilePicture(file: File) {
  try {
    const supabase = createServerClient()
    const adminClient = createAdminClient()

    // Try multiple methods to get the user ID
    let userId = null

    // Method 1: Try to get user from Supabase session
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session?.user) {
        userId = sessionData.session.user.id
        console.log("Using user ID from Supabase session:", userId)
      }
    } catch (sessionError) {
      console.error("Error getting session:", sessionError)
      // Continue to next method
    }

    // Method 2: Try to get user from JWT if session failed
    if (!userId) {
      try {
        const { getJWTFromCookies, verifyJWT } = await import("@/lib/jwt")
        const jwt = getJWTFromCookies()
        if (jwt) {
          const { payload, error } = await verifyJWT(jwt)
          if (!error && payload && (payload.userId || payload.sub)) {
            userId = payload.userId || payload.sub
            console.log("Using user ID from JWT:", userId)
          }
        }
      } catch (jwtError) {
        console.error("Error verifying JWT:", jwtError)
        // Continue to next method
      }
    }

    // If we still don't have a user ID, return an error
    if (!userId) {
      console.error("No authenticated user found for profile picture upload")
      return { error: "Authentication failed. Please try logging in again." }
    }

    // Generate a unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload the file using admin client to bypass RLS
    const { error: uploadError, data } = await adminClient.storage.from("profiles").upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    })

    if (uploadError) {
      console.error("Error uploading profile picture:", uploadError)
      return { error: uploadError.message }
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = adminClient.storage.from("profiles").getPublicUrl(fileName)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error("Unexpected error uploading profile picture:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
