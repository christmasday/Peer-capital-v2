import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"

/**
 * Gets a user's profile for messaging purposes
 * This function is more lenient than other profile fetching functions
 * as it only requires the profile to exist in the database
 */
export async function getUserProfileForMessaging(userId: string) {
  if (!userId || userId.trim() === "") {
    return { profile: null, error: "Invalid user ID" }
  }

  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // First try to get the profile using the regular client
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profile) {
      return { profile, error: null }
    }

    // If that fails due to RLS, try with admin client
    if (error) {
      const adminClient = createAdminClient()

      const { data: adminProfile, error: adminError } = await adminClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (adminProfile) {
        return { profile: adminProfile, error: null }
      }

      if (adminError) {
        return { profile: null, error: "User profile not found" }
      }
    }

    return { profile: null, error: "User profile not found" }
  } catch (error) {
    return {
      profile: null,
      error: error instanceof Error ? error.message : "Unknown error fetching user profile",
    }
  }
}
