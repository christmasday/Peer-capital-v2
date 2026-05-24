"use server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/actions/notifications"
import { getCurrentUserId } from "@/lib/auth-utils"

// Helper function to get user profile info
async function getUserProfileInfo(userId: string) {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name, email, profile_picture_url")
      .eq("id", userId)
      .single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

// Helper function to check if a profile exists for a user ID
async function checkProfileExists(userId: string) {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.from("profiles").select("id").eq("id", userId).single()

    if (error) {
      return false
    }

    return !!data
  } catch (error) {
    return false
  }
}

// Helper function to check if the user_connections table exists
async function checkTableExists() {
  try {
    const adminClient = createAdminClient()

    // Try a simple query on the table and catch the error if it doesn't exist
    const { data, error } = await adminClient.from("user_connections").select("id").limit(1)

    // If there's an error with code 42P01, the table doesn't exist
    // 42P01 is the PostgreSQL error code for "undefined_table"
    if (error && error.code === "42P01") {
      return false
    }

    // If there's any other error, log it but assume the table exists
    // to avoid blocking functionality unnecessarily
    if (error) {
    }

    return true
  } catch (error) {
    return false
  }
}

// Follow a user
export async function followUser(followingId: string) {
  try {
    const tableExists = await checkTableExists()
    if (!tableExists) {
      return { error: "User connections feature is not available yet. Please run the migration first." }
    }

    // Get the current user's ID using our helper function
    const followerId = await getCurrentUserId()

    if (!followerId) {
      return { error: "You must be logged in to follow users" }
    }

    // Check if profiles exist for both users
    const followerProfileExists = await checkProfileExists(followerId)
    const followingProfileExists = await checkProfileExists(followingId)

    if (!followerProfileExists) {
      return { error: "Your profile is not set up correctly. Please update your profile first." }
    }

    if (!followingProfileExists) {
      return { error: "The user you're trying to follow doesn't have a valid profile." }
    }

    const adminClient = createAdminClient()

    // Don't allow users to follow themselves
    if (followerId === followingId) {
      return { error: "You cannot follow yourself" }
    }

    // Check if the connection already exists
    const { data: existingConnection, error: checkError } = await adminClient
      .from("user_connections")
      .select("*")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is expected if not following
      return { error: "Failed to check if already following" }
    }

    if (existingConnection) {
      // If already following, return success
      if (existingConnection.status === "active") {
        return { success: true, alreadyFollowing: true }
      }

      // If blocked or pending, update to active
      const { error: updateError } = await adminClient
        .from("user_connections")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", existingConnection.id)

      if (updateError) {
        return { error: "Failed to update connection" }
      }
    } else {
      // Create a new connection
      const { error: insertError } = await adminClient.from("user_connections").insert({
        follower_id: followerId,
        following_id: followingId,
        status: "active",
      })

      if (insertError) {
        if (insertError.message && insertError.message.includes("violates foreign key constraint")) {
          return {
            error:
              "Unable to follow user due to a database constraint. Please use the 'Fix Connection Foreign Keys' button in the admin panel.",
          }
        }
        return { error: "Failed to follow user" }
      }

      // Create a notification for the user being followed
      try {
        // Get follower profile info
        const followerProfile = await getUserProfileInfo(followerId)

        if (followerProfile) {
          const followerName =
            `${followerProfile.first_name || ""} ${followerProfile.last_name || ""}`.trim() || "Someone"

          // Create notification with the correct schema
          await createNotification({
            userId: followingId,
            type: "follow",
            content: `${followerName} is now following you!`,
            actorId: followerId,
            referenceId: followerId, // Using follower ID as reference
            data: {
              followerName,
              followerProfilePicture: followerProfile.profile_picture_url,
            },
          })
        }
      } catch (notificationError) {
        // Log the error but don't fail the follow action
      }
    }

    // Revalidate the profile page to show updated follow status
    revalidatePath(`/profile/${followingId}`)
    revalidatePath(`/profile/${followerId}`)

    return { success: true }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}

// Unfollow a user
export async function unfollowUser(followingId: string) {
  try {
    const tableExists = await checkTableExists()
    if (!tableExists) {
      return { error: "User connections feature is not available yet. Please run the migration first." }
    }

    // Get the current user's ID using our helper function
    const followerId = await getCurrentUserId()

    if (!followerId) {
      return { error: "You must be logged in to unfollow users" }
    }

    const adminClient = createAdminClient()

    // Delete the connection
    const { error } = await adminClient
      .from("user_connections")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId)

    if (error) {
      return { error: "Failed to unfollow user" }
    }

    // Revalidate the profile page to show updated follow status
    revalidatePath(`/profile/${followingId}`)
    revalidatePath(`/profile/${followerId}`)

    return { success: true }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}

// Check if the current user is following another user
export async function isFollowingUser(followingId: string) {
  try {
    const tableExists = await checkTableExists()
    if (!tableExists) {
      return { following: false }
    }

    // Get the current user's ID using our helper function
    const followerId = await getCurrentUserId()

    if (!followerId) {
      return { following: false }
    }

    const adminClient = createAdminClient()

    // Check if the connection exists
    const { data, error } = await adminClient
      .from("user_connections")
      .select("*")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .eq("status", "active")
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is expected if not following
      return { error: "Failed to check if following" }
    }

    return { following: !!data }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}

// Get followers count
export async function getFollowersCount(userId: string) {
  try {
    const tableExists = await checkTableExists()
    if (!tableExists) {
      return { count: 0 }
    }

    const adminClient = createAdminClient()

    const { count, error } = await adminClient
      .from("user_connections")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId)
      .eq("status", "active")

    if (error) {
      return { error: "Failed to get followers count" }
    }

    return { count }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}

// Get following count
export async function getFollowingCount(userId: string) {
  try {
    const tableExists = await checkTableExists()
    if (!tableExists) {
      return { count: 0 }
    }

    const adminClient = createAdminClient()

    const { count, error } = await adminClient
      .from("user_connections")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId)
      .eq("status", "active")

    if (error) {
      return { error: "Failed to get following count" }
    }

    return { count }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}

// Get followers list with profile information
export async function getFollowers(userId: string, page = 1, limit = 10) {
  try {
    const tableExists = await checkTableExists()
    if (!tableExists) {
      return { followers: [] }
    }

    const adminClient = createAdminClient()
    const offset = (page - 1) * limit

    // First, get the connections
    const { data: connections, error: connectionsError } = await adminClient
      .from("user_connections")
      .select("id, follower_id, created_at")
      .eq("following_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (connectionsError) {
      return { error: "Failed to get followers" }
    }

    if (!connections || connections.length === 0) {
      return { followers: [] }
    }

    // Get the follower IDs
    const followerIds = connections.map((connection) => connection.follower_id)

    // Then, get the profile information for each follower
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name, email, profile_picture_url")
      .in("id", followerIds)

    if (profilesError) {
      return { error: "Failed to get follower profiles" }
    }

    // Create a map of profiles by ID for easy lookup
    const profilesMap = new Map()
    profiles?.forEach((profile) => {
      profilesMap.set(profile.id, profile)
    })

    // Combine the connection and profile data
    const followers = connections.map((connection) => {
      const profile = profilesMap.get(connection.follower_id) || {}
      return {
        connectionId: connection.id,
        userId: connection.follower_id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        profilePictureUrl: profile.profile_picture_url,
        followedAt: connection.created_at,
      }
    })

    return { followers }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}

// Get following list with profile information
export async function getFollowing(userId: string, page = 1, limit = 10) {
  try {
    const tableExists = await checkTableExists()
    if (!tableExists) {
      return { following: [] }
    }

    const adminClient = createAdminClient()
    const offset = (page - 1) * limit

    // First, get the connections
    const { data: connections, error: connectionsError } = await adminClient
      .from("user_connections")
      .select("id, following_id, created_at")
      .eq("follower_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (connectionsError) {
      return { error: "Failed to get following" }
    }

    if (!connections || connections.length === 0) {
      return { following: [] }
    }

    // Get the following IDs
    const followingIds = connections.map((connection) => connection.following_id)

    // Then, get the profile information for each following
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name, email, profile_picture_url")
      .in("id", followingIds)

    if (profilesError) {
      return { error: "Failed to get following profiles" }
    }

    // Create a map of profiles by ID for easy lookup
    const profilesMap = new Map()
    profiles?.forEach((profile) => {
      profilesMap.set(profile.id, profile)
    })

    // Combine the connection and profile data
    const following = connections.map((connection) => {
      const profile = profilesMap.get(connection.following_id) || {}
      return {
        connectionId: connection.id,
        userId: connection.following_id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        profilePictureUrl: profile.profile_picture_url,
        followedAt: connection.created_at,
      }
    })

    return { following }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}
