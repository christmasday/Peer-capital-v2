import { createAdminClient } from "@/lib/supabase/admin"

// List of all buckets needed by the application
const REQUIRED_BUCKETS = ["profiles", "profile-images", "id_documents"]

export async function setupStorage() {
  try {
    const adminClient = createAdminClient()

    // Check if we're in offline mode
    if (process.env.OFFLINE_MODE === "true") {
      return { success: true }
    }


    // List existing buckets
    const { data: buckets, error: listError } = await adminClient.storage.listBuckets()

    if (listError) {
      return { error: "Failed to list buckets" }
    }

    // Create any missing buckets
    for (const bucketName of REQUIRED_BUCKETS) {
      const bucketExists = buckets?.some((bucket) => bucket.name === bucketName)

      if (!bucketExists) {
        const { error: createError } = await adminClient.storage.createBucket(bucketName, {
          public: true,
        })

        if (createError) {
          // Continue with other buckets even if one fails
        } else {
        }
      } else {
      }
    }

    return { success: true }
  } catch (error) {
    return { error: "An unexpected error occurred during storage setup" }
  }
}

// Function to check if a specific bucket exists
export async function checkBucketExists(bucketName: string) {
  try {
    const adminClient = createAdminClient()

    // Check if the bucket exists
    const { data: buckets, error: listError } = await adminClient.storage.listBuckets()

    if (listError) {
      return { exists: false, error: listError.message }
    }

    const exists = buckets?.some((bucket) => bucket.name === bucketName) || false
    return { exists, error: null }
  } catch (error) {
    return { exists: false, error: String(error) }
  }
}

// Function to create a specific bucket if it doesn't exist
export async function createBucketIfNotExists(bucketName: string) {
  try {
    const adminClient = createAdminClient()

    // First check if the bucket exists
    const { exists, error: checkError } = await checkBucketExists(bucketName)

    if (checkError) {
      return { success: false, error: checkError }
    }

    if (exists) {
      return { success: true, message: `${bucketName} bucket already exists` }
    }

    // Create the bucket
    const { error: createError } = await adminClient.storage.createBucket(bucketName, {
      public: true,
    })

    if (createError) {
      return { success: false, error: createError.message }
    }

    return { success: true, message: `${bucketName} bucket created successfully` }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
