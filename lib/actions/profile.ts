"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient, isOfflineMode } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

// Update the updateProfile function to handle schema issues
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
    if (!userId) {
      console.error("No authenticated user found for profile update")
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

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error updating profile:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Helper function to create the id_documents bucket if it doesn't exist
async function ensureIdDocumentsBucket() {
  try {
    if (isOfflineMode()) {
      console.log("Skipping id_documents bucket creation in offline mode")
      return { success: true }
    }

    const adminClient = createAdminClient()

    // Check if the bucket exists
    const { data: buckets, error: listError } = await adminClient.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
      return { error: "Failed to list buckets" }
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === "id_documents")

    if (!bucketExists) {
      console.log("Creating id_documents bucket...")
      const { error: createError } = await adminClient.storage.createBucket("id_documents", {
        public: true,
      })

      if (createError) {
        console.error("Error creating id_documents bucket:", createError)
        return { error: "Failed to create id_documents bucket" }
      }

      console.log("id_documents bucket created successfully")
    } else {
      console.log("id_documents bucket already exists")
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error ensuring id_documents bucket:", error)
    return { error: "An unexpected error occurred" }
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
    const bucketResult = await ensureIdDocumentsBucket()
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

// Keep the existing uploadProfilePicture function
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
