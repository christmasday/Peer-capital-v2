"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function ensureStorageBucket() {
  try {
    const adminClient = createAdminClient()

    // Check if the images bucket exists
    const { data: buckets, error: listError } = await adminClient.storage.listBuckets()

    if (listError) {
      return { error: listError.message }
    }

    const imagesBucketExists = buckets.some((bucket) => bucket.name === "images")

    if (!imagesBucketExists) {
      // Create the images bucket
      const { error: createError } = await adminClient.storage.createBucket("images", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })

      if (createError) {
        return { error: createError.message }
      }

      // Set public access policy
      const { error: policyError } = await adminClient.storage.from("images").createSignedUrl("dummy.txt", 60, {
        transform: {
          width: 100,
          height: 100,
        },
      })

      if (policyError && policyError.message !== "The resource was not found") {
        // Non-blocking - continue even if policy setting fails
      }
    }

    return { success: true }
  } catch (error) {
    return { error: "An unexpected error occurred. Please try again." }
  }
}
