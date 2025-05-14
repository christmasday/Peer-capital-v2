"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createProfileActivityNotification } from "./activity-notifications"
import { v4 as uuidv4 } from "uuid"

// Function to determine if the app is running in offline mode
function isOfflineMode(): boolean {
  return process.env.OFFLINE_MODE === "true"
}

// Enhanced function to get the current user ID with multiple fallbacks
async function getCurrentUserId() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    const adminClient = createAdminClient()

    // Method 1: Try to get user from Supabase session
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session?.user) {
        return { userId: sessionData.session.user.id, method: "supabase-session" }
      }
    } catch (sessionError) {
      console.error("Error getting session:", sessionError)
      // Continue to next method
    }

    // Method 2: Try to get user from JWT
    try {
      const { getJWTFromCookies, verifyJWT } = await import("@/lib/jwt")
      const jwt = getJWTFromCookies()
      if (jwt) {
        const { payload, error } = await verifyJWT(jwt)
        if (!error && payload && (payload.userId || payload.sub)) {
          return { userId: payload.userId || payload.sub, method: "jwt" }
        }
      }
    } catch (jwtError) {
      console.error("Error verifying JWT:", jwtError)
      // Continue to next method
    }

    // Method 3: Try to get user from custom auth token
    try {
      const customAuthToken = cookieStore.get("custom-auth-token")?.value
      if (customAuthToken) {
        const { data, error } = await adminClient
          .from("auth_users")
          .select("id")
          .eq("access_token", customAuthToken)
          .single()

        if (!error && data) {
          return { userId: data.id, method: "custom-auth-token" }
        }
      }
    } catch (customAuthError) {
      console.error("Error checking custom auth token:", customAuthError)
      // Continue to next method
    }

    // No valid authentication found
    return { userId: null, method: "none" }
  } catch (error) {
    console.error("Error in getCurrentUserId:", error)
    return { userId: null, method: "error" }
  }
}

// Helper function to ensure a storage bucket exists
async function ensureBucketExists(bucketName: string) {
  try {
    if (isOfflineMode()) {
      console.log(`Skipping ${bucketName} bucket creation in offline mode`)
      return { success: true }
    }

    const adminClient = createAdminClient()

    // Check if the bucket exists
    console.log(`Checking if ${bucketName} bucket exists...`)
    const { data: buckets, error: listError } = await adminClient.storage.listBuckets()

    if (listError) {
      console.error(`Error listing buckets:`, listError)
      return { error: `Failed to list buckets: ${listError.message}` }
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName)

    if (!bucketExists) {
      console.log(`Creating ${bucketName} bucket...`)
      const { error: createError } = await adminClient.storage.createBucket(bucketName, {
        public: true,
      })

      if (createError) {
        console.error(`Error creating ${bucketName} bucket:`, createError)
        return { error: `Failed to create ${bucketName} bucket: ${createError.message}` }
      }

      console.log(`${bucketName} bucket created successfully`)
    } else {
      console.log(`${bucketName} bucket already exists`)
    }

    return { success: true }
  } catch (error) {
    console.error(`Unexpected error ensuring ${bucketName} bucket:`, error)
    return { error: `An unexpected error occurred while checking/creating the ${bucketName} bucket` }
  }
}

// Helper function to create a storage bucket if it doesn't exist
async function createBucketIfNotExists(bucketName: string) {
  try {
    const adminClient = createAdminClient()

    // Check if the bucket exists
    const { data: buckets, error: listError } = await adminClient.storage.listBuckets()

    if (listError) {
      console.error(`Error listing buckets:`, listError)
      return { success: false, error: `Failed to list buckets: ${listError.message}` }
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName)

    if (!bucketExists) {
      // Create the bucket
      const { error: createError } = await adminClient.storage.createBucket(bucketName, {
        public: true,
      })

      if (createError) {
        console.error(`Error creating ${bucketName} bucket:`, createError)
        return { success: false, error: `Failed to create ${bucketName} bucket: ${createError.message}` }
      }

      console.log(`${bucketName} bucket created successfully`)
    } else {
      console.log(`${bucketName} bucket already exists`)
    }

    return { success: true }
  } catch (error) {
    console.error(`Error in createBucketIfNotExists:`, error)
    return { success: false, error: `An unexpected error occurred: ${error.message}` }
  }
}

// Update the updateProfile function to validate userId before database operations
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
  // ID verification fields
  idType,
  idNumber,
  idDocumentUrl,
  // Employment information fields
  employmentStatus,
  employerName,
  employerAddress,
  workPhone,
  jobTitle,
  monthlyIncome,
  employmentStartDate,
  employmentEndDate,
  // Withdrawal account fields
  bankName,
  accountNumber,
  accountName,
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
  // ID verification fields
  idType?: string
  idNumber?: string
  idDocumentUrl?: string | null
  // Employment information fields
  employmentStatus?: string
  employerName?: string
  employerAddress?: string
  workPhone?: string
  jobTitle?: string
  monthlyIncome?: number
  employmentStartDate?: string
  employmentEndDate?: string
  // Withdrawal account fields
  bankName?: string
  accountNumber?: string
  accountName?: string
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
    if (!userId || userId === "undefined") {
      console.error("No authenticated user found for profile update or invalid user ID:", userId)
      return { error: "Authentication failed. Please try logging in again." }
    }

    // First, try to get the current profile to check which fields exist
    const { data: currentProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Error fetching current profile:", profileError)
      return { error: "Failed to fetch current profile" }
    }

    // Split the update into two parts: basic fields and extended fields
    // Basic fields are guaranteed to exist in the schema
    const basicUpdateObject = {
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName,
      phone_number: phoneNumber,
      address: address,
      city: city,
      state: state,
      zip_code: zipCode || null,
      profile_picture_url: profilePictureUrl || null,
      updated_at: new Date().toISOString(),
    }

    // Update basic fields first
    const { error: basicUpdateError } = await adminClient.from("profiles").update(basicUpdateObject).eq("id", userId)

    if (basicUpdateError) {
      console.error("Error updating basic profile fields:", basicUpdateError)
      return { error: basicUpdateError.message }
    }

    // Now try to update the extended fields if they exist in the current profile
    // We'll do this in separate updates to isolate any schema issues

    // Update BVN and date of birth if they exist in the schema
    if (bvn || dateOfBirth) {
      const bvnDateObject: any = {}
      if (bvn) bvnDateObject.bvn = bvn
      if (dateOfBirth) bvnDateObject.date_of_birth = dateOfBirth

      try {
        await adminClient.from("profiles").update(bvnDateObject).eq("id", userId)
      } catch (err) {
        console.warn("Could not update BVN or date of birth fields:", err)
        // Continue with other updates
      }
    }

    // Update ID verification fields if they exist in the schema
    if (idType || idNumber || idDocumentUrl) {
      const idVerificationObject: any = {}
      if (idType) idVerificationObject.id_type = idType
      if (idNumber) idVerificationObject.id_number = idNumber
      if (idDocumentUrl) idVerificationObject.id_document_url = idDocumentUrl

      try {
        await adminClient.from("profiles").update(idVerificationObject).eq("id", userId)
      } catch (err) {
        console.warn("Could not update ID verification fields:", err)
        // Continue with other updates
      }
    }

    // Update employment fields if they exist in the schema
    if (
      employmentStatus ||
      employerName ||
      employerAddress ||
      workPhone ||
      jobTitle ||
      monthlyIncome !== undefined ||
      employmentStartDate ||
      employmentEndDate
    ) {
      // Try updating each employment field individually to isolate schema issues
      const updateEmploymentField = async (fieldName: string, value: any) => {
        try {
          const updateObj: any = {}
          updateObj[fieldName] = value
          await adminClient.from("profiles").update(updateObj).eq("id", userId)
        } catch (err) {
          console.warn(`Could not update ${fieldName} field:`, err)
          // Continue with other fields
        }
      }

      if (employmentStatus) await updateEmploymentField("employment_status", employmentStatus)
      if (employerName) await updateEmploymentField("employer_name", employerName)
      if (employerAddress) await updateEmploymentField("employer_address", employerAddress)
      if (workPhone) await updateEmploymentField("work_phone", workPhone)
      if (jobTitle) await updateEmploymentField("job_title", jobTitle)
      if (monthlyIncome !== undefined) await updateEmploymentField("monthly_income", monthlyIncome)
      if (employmentStartDate) await updateEmploymentField("employment_start_date", employmentStartDate)
      if (employmentEndDate) await updateEmploymentField("employment_end_date", employmentEndDate)
    }

    // Update withdrawal account fields
    if (bankName || accountNumber || accountName) {
      const withdrawalAccountObject: any = {}
      if (bankName) withdrawalAccountObject.bank_name = bankName
      if (accountNumber) withdrawalAccountObject.account_number = accountNumber
      if (accountName) withdrawalAccountObject.account_name = accountName

      try {
        await adminClient.from("profiles").update(withdrawalAccountObject).eq("id", userId)
      } catch (err) {
        console.warn("Could not update withdrawal account fields:", err)
        // Continue with other updates
      }
    }

    // Create activity notification for profile update
    try {
      await createProfileActivityNotification({
        userId,
        type: "updated",
        details: "Your profile information has been updated successfully",
      })
    } catch (notificationError) {
      console.error("Error creating profile update notification:", notificationError)
      // Non-blocking - continue even if notification fails
    }

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error updating profile:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Add a function to upload ID document
export async function uploadIdDocument(file: File) {
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
      console.error("No authenticated user found for ID document upload")
      return { error: "Authentication failed. Please try logging in again." }
    }

    // Ensure the id_documents bucket exists
    const bucketResult = await ensureBucketExists("id_documents")
    if (bucketResult.error) {
      console.error("Error ensuring id_documents bucket:", bucketResult.error)
      return { error: bucketResult.error }
    }

    // Generate a unique file name
    const fileExt = file.name.split(".").pop()
    // Sanitize the filename to prevent injection attacks
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const fileName = `id-${userId}-${Date.now()}-${sanitizedFileName}.${fileExt}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload the file using admin client to bypass RLS
    const { error: uploadError, data } = await adminClient.storage.from("id_documents").upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    })

    if (uploadError) {
      console.error("Error uploading ID document:", uploadError)
      return { error: `Failed to upload ID document: ${uploadError.message}` }
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = adminClient.storage.from("id_documents").getPublicUrl(fileName)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error("Unexpected error uploading ID document:", error)
    return {
      error: `An unexpected error occurred. Please try again. ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Update the uploadBannerImage function with enhanced authentication and bucket check
export async function uploadBannerImage(file: File) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    const adminClient = createAdminClient()

    // Get current user ID with enhanced method
    const { userId, method } = await getCurrentUserId()

    if (!userId) {
      console.error("No authenticated user found for banner upload")
      return { error: "You must be logged in to upload a banner image. Please refresh and try again." }
    }

    console.log(`User authenticated via ${method} for banner upload. User ID: ${userId}`)

    // Ensure the profile-images bucket exists
    const bucketResult = await ensureBucketExists("profile-images")
    if (bucketResult.error) {
      console.error("Error ensuring profile-images bucket:", bucketResult.error)
      return { error: bucketResult.error }
    }

    // Generate a unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}-banner-${uuidv4()}.${fileExt}`
    const filePath = `banners/${fileName}`

    // Convert File to ArrayBuffer for more reliable upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload the file to Supabase Storage using admin client for reliability
    const { error: uploadError } = await adminClient.storage.from("profile-images").upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

    if (uploadError) {
      console.error("Error uploading banner image:", uploadError)
      return { error: `Failed to upload banner image: ${uploadError.message}. Please try again.` }
    }

    // Get the public URL
    const { data: publicUrlData } = adminClient.storage.from("profile-images").getPublicUrl(filePath)

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return { error: "Failed to get public URL for the banner image" }
    }

    // Update the user's profile with the new banner image URL
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        banner_image_url: publicUrlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating profile with banner image:", updateError)
      return { error: "Failed to update profile with banner image. Please try again." }
    }

    // Create activity notification for profile update
    try {
      await createProfileActivityNotification({
        userId,
        type: "updated",
        details: "Your profile banner has been updated",
      })
    } catch (notificationError) {
      console.error("Error creating profile update notification:", notificationError)
      // Non-blocking - continue even if notification fails
    }

    // Revalidate the profile page
    revalidatePath("/profile")
    revalidatePath(`/profile/${userId}`)

    return { success: true, url: publicUrlData.publicUrl }
  } catch (error) {
    console.error("Error in uploadBannerImage:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Update the selectBannerImage function with enhanced authentication
export async function selectBannerImage(bannerUrl: string) {
  try {
    const adminClient = createAdminClient()

    // Get current user ID with enhanced method
    const { userId, method } = await getCurrentUserId()

    if (!userId) {
      console.error("No authenticated user found for banner selection")
      return { error: "You must be logged in to select a banner image. Please refresh and try again." }
    }

    console.log(`User authenticated via ${method} for banner selection. User ID: ${userId}`)

    // Update the user's profile with the selected banner image URL
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        banner_image_url: bannerUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating profile with banner image:", updateError)
      return { error: "Failed to update profile with banner image. Please try again." }
    }

    // Create activity notification for profile update
    try {
      await createProfileActivityNotification({
        userId,
        type: "updated",
        details: "Your profile banner has been updated",
      })
    } catch (notificationError) {
      console.error("Error creating profile update notification:", notificationError)
      // Non-blocking - continue even if notification fails
    }

    // Revalidate the profile page
    revalidatePath("/profile")
    revalidatePath(`/profile/${userId}`)

    return { success: true }
  } catch (error) {
    console.error("Error in selectBannerImage:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Update the uploadProfilePicture function with bucket check
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

    // Ensure the profiles bucket exists
    const bucketResult = await ensureBucketExists("profiles")
    if (bucketResult.error) {
      console.error("Error ensuring profiles bucket:", bucketResult.error)

      // Try to create bucket one more time with a different approach
      try {
        const { success: bucketSuccess } = await createBucketIfNotExists("profiles")
        if (!bucketSuccess) {
          return { error: "Unable to access storage system. Please try again later." }
        }
      } catch (createError) {
        console.error("Second attempt to create bucket failed:", createError)
        return { error: "Storage system is temporarily unavailable." }
      }
    }

    // Generate a unique file name with sanitization
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
    // Create a clean filename with user ID and timestamp
    const fileName = `avatar_${userId}_${Date.now()}.${fileExt}`

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

      if (uploadError.message.includes("Duplicate")) {
        // If duplicate error, try with a different filename
        const retryFileName = `avatar_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`

        const { error: retryError, data: retryData } = await adminClient.storage
          .from("profiles")
          .upload(retryFileName, buffer, {
            contentType: file.type,
            upsert: true,
          })

        if (retryError) {
          return { error: `Failed to upload profile picture after retry: ${retryError.message}` }
        }

        // Get the public URL after successful retry
        const {
          data: { publicUrl },
        } = adminClient.storage.from("profiles").getPublicUrl(retryFileName)

        // Update the user's profile with the new profile picture URL
        await adminClient
          .from("profiles")
          .update({ profile_picture_url: publicUrl, updated_at: new Date().toISOString() })
          .eq("id", userId)

        return { success: true, url: publicUrl }
      }

      return { error: uploadError.message }
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = adminClient.storage.from("profiles").getPublicUrl(fileName)

    // Update the user's profile with the new profile picture URL
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ profile_picture_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating profile with new avatar URL:", updateError)
      // Return success anyway as the image was uploaded successfully
      return { success: true, url: publicUrl, warning: "Image uploaded but profile not updated" }
    }

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error("Unexpected error uploading profile picture:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
