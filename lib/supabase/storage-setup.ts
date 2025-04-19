import { createProfilesBucket, checkProfilesBucket } from "@/lib/actions/storage"

export async function setupStorage() {
  try {
    // Check if the profiles bucket exists
    const { exists } = await checkProfilesBucket()

    // Create the profiles bucket if it doesn't exist
    if (!exists) {
      const result = await createProfilesBucket()
      if (!result.success) {
        console.error("Failed to create profiles bucket:", result.error)
      } else {
        console.log("Created profiles bucket successfully")
      }
    }
  } catch (error) {
    console.error("Error setting up storage:", error)
  }
}
