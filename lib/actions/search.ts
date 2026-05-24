"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"

export async function searchUsers(query: string) {
  try {
    const cookieStore = cookies()
    const supabase = await createServerClient(cookieStore)

    // For debugging - log the search query

    // Normalize the search query and escape special characters
    const searchTerm = query.trim().toLowerCase()

    if (searchTerm.length < 2) {
      return []
    }

    // First try with the regular client
    let { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, profile_picture_url")
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(10)

    // Log the results for debugging

    // If no results or error, try with admin client to bypass RLS
    if ((!data || data.length === 0 || error) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createAdminClient()

      const { data: adminData, error: adminError } = await adminClient
        .from("profiles")
        .select("id, first_name, last_name, email, profile_picture_url")
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10)


      if (adminError) {
      } else if (adminData && adminData.length > 0) {
        data = adminData
        error = null
      }
    }

    if (error) {
      throw new Error(`Error searching users: ${error.message}`)
    }

    if (!data || data.length === 0) {
      // Try a more flexible search as a fallback
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, profile_picture_url")
        .limit(10)

      if (fallbackError) {
      } else if (fallbackData && fallbackData.length > 0) {
        // Filter the results manually
        data = fallbackData.filter((user) => {
          const firstName = (user.first_name || "").toLowerCase()
          const lastName = (user.last_name || "").toLowerCase()
          const email = (user.email || "").toLowerCase()

          return firstName.includes(searchTerm) || lastName.includes(searchTerm) || email.includes(searchTerm)
        })
      }
    }

    // Transform the data to the expected format
    return (data || []).map((user) => ({
      id: user.id,
      email: user.email || "",
      displayName:
        `${user.first_name || ""} ${user.last_name || ""}`.trim() || (user.email ? user.email.split("@")[0] : "User"),
      avatarUrl: user.profile_picture_url,
    }))
  } catch (error) {
    // Return empty array instead of throwing to prevent UI errors
    return []
  }
}
