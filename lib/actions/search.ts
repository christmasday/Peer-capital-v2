"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"

export async function searchUsers(query: string) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // For debugging - log the search query
    console.log("Searching for:", query)

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
    console.log("Search results:", data, "Error:", error)

    // If no results or error, try with admin client to bypass RLS
    if ((!data || data.length === 0 || error) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("Trying with admin client")
      const adminClient = createAdminClient()

      const { data: adminData, error: adminError } = await adminClient
        .from("profiles")
        .select("id, first_name, last_name, email, profile_picture_url")
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10)

      console.log("Admin search results:", adminData, "Error:", adminError)

      if (adminError) {
        console.error("Admin search error:", adminError)
      } else if (adminData && adminData.length > 0) {
        data = adminData
        error = null
      }
    }

    if (error) {
      console.error("Error searching users:", error)
      throw new Error(`Error searching users: ${error.message}`)
    }

    if (!data || data.length === 0) {
      // Try a more flexible search as a fallback
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, profile_picture_url")
        .limit(10)

      if (fallbackError) {
        console.error("Fallback search error:", fallbackError)
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
    console.error("Error in searchUsers:", error)
    // Return empty array instead of throwing to prevent UI errors
    return []
  }
}
