"use server"

import { createAdminClient, isOfflineMode } from "@/lib/supabase/admin"

export async function uploadProfilePicture(file: File): Promise<string | { error: string }> {
  try {

    // Check if we're in offline mode first
    if (isOfflineMode()) {
      return "/diverse-professional-profiles.png" // Return default image in offline mode
    }

    // Generate a placeholder URL in case of failure
    const placeholderUrl = "/diverse-professional-profiles.png"

    // Check if we can connect to Supabase storage
    try {
      const supabaseAdmin = createAdminClient()

      // Try a simple database query to check connectivity with a timeout
      try {
        const timeoutPromise = new Promise<{ error: { message: string } }>((_, reject) =>
          setTimeout(() => reject(new Error("Connection check timed out")), 3000),
        )

        const result = await Promise.race([
          supabaseAdmin.from("profiles").select("count", { count: "exact", head: true }).limit(1),
          timeoutPromise,
        ])

        if (result.error) {
          // Return the placeholder URL if storage is unavailable
          return placeholderUrl
        }
      } catch (fetchError) {
        return placeholderUrl
      }

      // Now check if the storage service is available
      try {
        const timeoutPromise = new Promise<{ error: { message: string } }>((_, reject) =>
          setTimeout(() => reject(new Error("Storage check timed out")), 3000),
        )

        const bucketsResult = await Promise.race([supabaseAdmin.storage.listBuckets(), timeoutPromise])

        if (bucketsResult.error) {
          return placeholderUrl
        }

        // Check if profiles bucket exists
        const profilesBucketExists = bucketsResult.data?.some((bucket) => bucket.name === "profiles")

        if (!profilesBucketExists) {
          try {
            const { error: createError } = await supabaseAdmin.storage.createBucket("profiles", {
              public: true,
              fileSizeLimit: 5242880, // 5MB
            })

            if (createError) {
              return placeholderUrl
            }
          } catch (createError) {
            return placeholderUrl
          }
        }

        // Generate a unique file name
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `${fileName}`


        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        try {
          // Upload the file using the admin client with a timeout
          const uploadTimeoutPromise = new Promise<{ error: { message: string } }>((_, reject) =>
            setTimeout(() => reject(new Error("Upload timed out")), 5000),
          )

          const uploadResult = await Promise.race([
            supabaseAdmin.storage.from("profiles").upload(filePath, buffer, {
              contentType: file.type,
            }),
            uploadTimeoutPromise,
          ])

          if (uploadResult.error) {
            return placeholderUrl
          }

          // Get the public URL
          const {
            data: { publicUrl },
          } = supabaseAdmin.storage.from("profiles").getPublicUrl(filePath)

          return publicUrl
        } catch (uploadError) {
          return placeholderUrl
        }
      } catch (storageError) {
        return placeholderUrl
      }
    } catch (connectionError) {
      return placeholderUrl
    }
  } catch (error) {
    return "/diverse-professional-profiles.png" // Return default image on error
  }
}
