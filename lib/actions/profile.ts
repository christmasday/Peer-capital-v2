"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createProfileActivityNotification } from "./activity-notifications"
import { v4 as uuidv4 } from "uuid"
import { Database } from "@/lib/supabase/database.types"

// Function to determine if the app is running in offline mode
function isOfflineMode(): boolean {
  return process.env.OFFLINE_MODE === 'true'
}

// Enhanced function to get the current user ID with multiple fallbacks
async function getCurrentUserId() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient()
    const adminClient = createAdminClient()

    // Method 1: Try to get user from Supabase session
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session?.user) {
        return { userId: sessionData.session.user.id, method: "supabase-session" }
      }
    } catch (sessionError: any) {
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
      const cookieStoreResolved = await cookies()
      const customAuthToken = cookieStoreResolved.get("custom-auth-token")?.value
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
      console.log(`Skipping ${bucketName} bucket check/creation in offline mode`)
      return { success: true }
    }

    const adminClient = createAdminClient()

    // Check if the bucket exists
    console.log(`Checking if ${bucketName} bucket exists...`)
    const { data: buckets, error: listError } = await adminClient.storage
      .listBuckets()

    if (listError) {
      console.error(`Error listing buckets:`, listError)
      return { error: `Failed to list buckets: ${listError.message}` }
    }

    const bucketExists = buckets?.some((bucket: { name: string }) => bucket.name === bucketName)

    if (!bucketExists) {
      console.log(`Creating ${bucketName} bucket...`)
      const { error: createError } = await adminClient.storage.createBucket(
        bucketName,
        {
          public: true,
        }
      )

      if (createError) {
        console.error(`Error creating ${bucketName} bucket:`, createError)
        return { error: `Failed to create ${bucketName} bucket: ${createError.message}` }
      }

      console.log(`${bucketName} bucket created successfully`)
    } else {
      console.log(`${bucketName} bucket already exists`)
    }

    return { success: true }
  } catch (error: any) {
    console.error(`Unexpected error ensuring ${bucketName} bucket:`, error)
    return { error: `An unexpected error occurred while checking/creating the ${bucketName} bucket: ${error.message}` }
  }
}

// Helper function to create a storage bucket if it doesn't exist
async function createBucketIfNotExists(bucketName: string) {
  try {
    if (isOfflineMode()) {
      console.log(`Skipping ${bucketName} bucket creation in offline mode`)
      return { success: true }
    }

    const adminClient = createAdminClient()

    // Check if the bucket exists
    const { data: buckets, error: listError } = await adminClient.storage
      .listBuckets()

    if (listError) {
      console.error(`Error listing buckets:`, listError)
      return { success: false, error: `Failed to list buckets: ${listError.message}` }
    }

    const bucketExists = buckets?.some((bucket: { name: string }) => bucket.name === bucketName)

    if (!bucketExists) {
      // Create the bucket
      const { error: createError } = await adminClient.storage.createBucket(
        bucketName,
        {
          public: true,
        }
      )

      if (createError) {
        console.error(`Error creating ${bucketName} bucket:`, createError)
        return { success: false, error: `Failed to create ${bucketName} bucket: ${createError.message}` }
      }

      console.log(`${bucketName} bucket created successfully`)
    } else {
      console.log(`${bucketName} bucket already exists`)
    }

    return { success: true }
  } catch (error: any) {
    console.error(`Error in createBucketIfNotExists:`, error)
    return { success: false, error: `An unexpected error occurred: ${error.message}` }
  }
}

// Add all possible fields to the type
type UpdateProfileInput = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  profilePictureUrl?: string | null;
  bvn?: string;
  dateOfBirth?: string;
  idType?: string;
  idNumber?: string;
  idDocumentUrl?: string | null;
  employmentStatus?: string;
  employerName?: string;
  employerAddress?: string;
  workPhone?: string;
  jobTitle?: string;
  monthlyIncome?: number;
  employmentStartDate?: string;
  employmentEndDate?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  schoolName?: string;
  degree?: string;
  fieldOfStudy?: string;
  graduationYear?: number;
  maritalStatus?: string;
  numberOfDependants?: number | null;
  lendingLicenseUrl?: string | null;
  loanAmountOffered?: number;
  interestRate?: number;
  paybackPeriodWeeks?: number;
};

export async function updateProfile(input: UpdateProfileInput) {
  try {
    if (isOfflineMode()) {
      console.log("Skipping profile update in offline mode")
      // Return a mock success response, adjust as needed based on expected behavior
      return { success: true, data: {} };
    }
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

    // Method 3: Try to get user from custom auth token if other methods failed
    if (!userId) {
      try {
        const cookieStoreResolved = await cookies()
        const customAuthToken = cookieStoreResolved.get("custom-auth-token")?.value
        if (customAuthToken) {
          const { data, error } = await adminClient
            .from("auth_users")
            .select("id")
            .eq("access_token", customAuthToken)
            .single()

          if (!error && data) {
            userId = data.id
            console.log("Using user ID from custom auth token for profile update:", userId)
          }
        }
      } catch (customAuthError) {
        console.error("Error checking custom auth token for profile update:", customAuthError)
        // Continue to next method
      }
    }

    if (!userId) {
      console.error("User ID not found after multiple attempts.");
      return { success: false, error: "Authentication failed." };
    }

    // Build update object
    const updateData: any = {};
    if (input.firstName !== undefined) updateData.first_name = input.firstName;
    if (input.middleName !== undefined) updateData.middle_name = input.middleName;
    if (input.lastName !== undefined) updateData.last_name = input.lastName;
    if (input.phoneNumber !== undefined) updateData.phone_number = input.phoneNumber;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.state !== undefined) updateData.state = input.state;
    if (input.zipCode !== undefined) updateData.zip_code = input.zipCode;
    if (input.profilePictureUrl !== undefined) updateData.profile_picture_url = input.profilePictureUrl;
    if (input.bvn !== undefined) updateData.bvn = input.bvn;
    if (input.dateOfBirth !== undefined) updateData.date_of_birth = input.dateOfBirth;
    if (input.idType !== undefined) updateData.id_type = input.idType;
    if (input.idNumber !== undefined) updateData.id_number = input.idNumber;
    if (input.idDocumentUrl !== undefined) updateData.id_document_url = input.idDocumentUrl;
    if (input.employmentStatus !== undefined) updateData.employment_status = input.employmentStatus;
    if (input.employerName !== undefined) updateData.employer_name = input.employerName;
    if (input.employerAddress !== undefined) updateData.employer_address = input.employerAddress;
    if (input.workPhone !== undefined) updateData.work_phone = input.workPhone;
    if (input.jobTitle !== undefined) updateData.job_title = input.jobTitle;
    if (input.monthlyIncome !== undefined) updateData.monthly_income = input.monthlyIncome;
    if (input.employmentStartDate !== undefined) updateData.employment_start_date = input.employmentStartDate;
    if (input.employmentEndDate !== undefined) updateData.employment_end_date = input.employmentEndDate;
    if (input.bankName !== undefined) updateData.bank_name = input.bankName;
    if (input.accountNumber !== undefined) updateData.account_number = input.accountNumber;
    if (input.accountName !== undefined) updateData.account_name = input.accountName;
    if (input.schoolName !== undefined) updateData.school_name = input.schoolName;
    if (input.degree !== undefined) updateData.degree = input.degree;
    if (input.fieldOfStudy !== undefined) updateData.field_of_study = input.fieldOfStudy;
    if (input.graduationYear !== undefined) updateData.graduation_year = input.graduationYear;
    // New fields
    if (input.maritalStatus !== undefined) updateData.marital_status = input.maritalStatus;
    if (input.numberOfDependants !== undefined) updateData.number_of_dependants = input.numberOfDependants;
    if (input.lendingLicenseUrl !== undefined) updateData.lending_license_url = input.lendingLicenseUrl;
    if (input.loanAmountOffered !== undefined) updateData.loan_amount_offered = input.loanAmountOffered;
    if (input.interestRate !== undefined) updateData.interest_rate = input.interestRate;
    if (input.paybackPeriodWeeks !== undefined) updateData.payback_period_weeks = input.paybackPeriodWeeks;

    if (Object.keys(updateData).length === 0) {
        return { success: false, error: "No fields to update." };
    }

    const { data, error } = await adminClient
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return { success: false, error: error.message };
    }

    console.log("Profile updated successfully:", data);

    // Create activity notification for profile update
    // Check if relevant fields were updated before creating notification
    // This is a basic check, you might want more granular checks
    const relevantFieldsUpdated = [input.firstName, input.lastName, input.phoneNumber, input.address, input.city, input.state, input.zipCode].some(field => field !== undefined);
    if (relevantFieldsUpdated) {
       // Note: Currently only creating a generic profile update notification.
       // Might need more specific notifications based on which fields are updated.
       await createProfileActivityNotification({
        userId,
        type: "updated",
        details: "Your profile has been updated.",
       });
    }

    revalidatePath("/profile"); // Revalidate profile page on successful update

    return { success: true, data: data };
  } catch (error: any) {
    console.error("Unexpected error in updateProfile:", error);
    return { success: false, error: "An unexpected error occurred: " + error.message };
  }
}

// Update the bio function to use 140 character limit
export async function updateBio(userId: string, bio: string) {
  try {
    if (isOfflineMode()) {
      console.log("Skipping bio update in offline mode")
      // Return a mock success response
      return { success: true }
    }

    if (!userId) {
      return { error: "User ID is required" }
    }

    // Changed from 250 to 140 character limit
    if (bio.length > 140) {
      return { error: "Bio cannot exceed 140 characters" }
    }

    const adminClient = createAdminClient()

    // Update just the bio field
    const { error } = await adminClient
      .from("profiles")
      .update({
        bio: bio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("Error updating bio:", error)
      return { error: error.message }
    }

    // Create activity notification for profile update
    try {
      await createProfileActivityNotification({
        userId,
        type: "updated",
        details: "Your profile bio has been updated",
      })
    } catch (notificationError) {
      console.error("Error creating profile update notification:", notificationError)
      // Non-blocking - continue even if notification fails
    }

    revalidatePath("/profile")
    revalidatePath(`/profile/${userId}`)

    return { success: true }
  } catch (error) {
    console.error("Unexpected error updating bio:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Add a function to upload ID document
export async function uploadIdDocument(file: File) {
  try {
    if (isOfflineMode()) {
      console.log("Skipping ID document upload in offline mode")
      // Return a mock success response with a placeholder URL
      return { success: true, url: "/placeholder-id.svg" }
    }
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
    if (isOfflineMode()) {
      console.log("Skipping banner image upload in offline mode")
      // Return a mock success response with a placeholder URL
      return { success: true, url: "/placeholder-banner.svg" }
    }
    const cookieStore = cookies()
    const supabase = createServerClient()
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
    if (isOfflineMode()) {
      console.log("Skipping banner image selection in offline mode")
      // Return a mock success response
      return { success: true }
    }
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
    if (isOfflineMode()) {
      console.log("Skipping profile picture upload in offline mode")
      // Return a mock success response with a placeholder URL
      return { success: true, url: "/placeholder-avatar.svg" }
    }
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

export async function updateSocialMedia(
  userId: string,
  socialMediaData: {
    facebook_url: string;
    linkedin_url: string;
    twitter_url: string;
    website: string;
  }
) {
  try {
    if (isOfflineMode()) {
      console.log("Skipping social media update in offline mode")
      // Return a mock success response
      return { success: true }
    }
    // Use the admin client for direct database operations within server actions
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("profiles")
      .update({
        facebook_url: socialMediaData.facebook_url || null,
        linkedin_url: socialMediaData.linkedin_url || null,
        twitter_url: socialMediaData.twitter_url || null,
        website: socialMediaData.website || null,
      })
      .eq("id", userId); // Await update before eq

    if (error) {
      console.error("Error updating social media:", error)
      return { success: false, error: error.message }
    }

    console.log("Social media updated successfully for user:", userId)
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error updating social media:", error)
    return { success: false, error: "An unexpected error occurred." }
  }
}

export async function uploadLendingLicenseServer(file: File) {
  try {
    if (isOfflineMode()) {
      console.log("Skipping lending license upload in offline mode");
      return { success: true, url: "/placeholder.svg" };
    }
    const adminClient = createAdminClient();
    // Optionally ensure the bucket exists (if you want):
    // await ensureBucketExists("lending-licenses");
    const fileExt = file.name.split(".").pop();
    const fileName = `lending-license-${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const { error: uploadError } = await adminClient.storage
      .from("lending-licenses")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });
    if (uploadError) {
      console.error("Error uploading lending license:", uploadError);
      return { error: `Failed to upload lending license: ${uploadError.message}` };
    }
    const { data: publicUrlData } = adminClient.storage
      .from("lending-licenses")
      .getPublicUrl(fileName);
    if (!publicUrlData || !publicUrlData.publicUrl) {
      return { error: "Failed to get public URL for the lending license image" };
    }
    return { success: true, url: publicUrlData.publicUrl };
  } catch (error: any) {
    console.error("Unexpected error uploading lending license:", error);
    return { error: `An unexpected error occurred. Please try again. ${error instanceof Error ? error.message : String(error)}` };
  }
}
