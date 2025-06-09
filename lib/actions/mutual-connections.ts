"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserId } from "@/lib/auth-utils"

// Helper function to check if the user_connections table exists
async function checkTableExists() {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.from("user_connections").select("id").limit(1)

    if (error && error.code === "42P01") {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

export async function getMutualConnections(userId: string, limit = 5) {
  try {
    const currentUserId = await getCurrentUserId()

    if (!currentUserId || currentUserId === userId) {
      return { connections: [], count: 0 }
    }

    const tableExists = await checkTableExists()
    if (!tableExists) {
      return { connections: [], count: 0 }
    }

    const adminClient = createAdminClient()

    // Get users that the current user is following
    const { data: currentUserFollowing, error: followingError } = await adminClient
      .from("user_connections")
      .select("following_id")
      .eq("follower_id", currentUserId)
      .eq("status", "active")

    if (followingError) {
      return { connections: [], count: 0 }
    }

    if (!currentUserFollowing || currentUserFollowing.length === 0) {
      return { connections: [], count: 0 }
    }

    // Get users that the profile owner is following
    const { data: profileUserFollowing, error: profileFollowingError } = await adminClient
      .from("user_connections")
      .select("following_id")
      .eq("follower_id", userId)
      .eq("status", "active")

    if (profileFollowingError) {
      return { connections: [], count: 0 }
    }

    if (!profileUserFollowing || profileUserFollowing.length === 0) {
      return { connections: [], count: 0 }
    }

    // Find the intersection of the two sets
    const currentUserFollowingIds = currentUserFollowing.map((connection) => connection.following_id)
    const profileUserFollowingIds = profileUserFollowing.map((connection) => connection.following_id)
    const mutualFollowingIds = currentUserFollowingIds.filter((id) => profileUserFollowingIds.includes(id))

    // Get the count of mutual connections
    const count = mutualFollowingIds.length

    if (count === 0) {
      return { connections: [], count: 0 }
    }

    // Get profile information for the mutual connections
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name, email, profile_picture_url")
      .in("id", mutualFollowingIds)
      .limit(limit)

    if (profilesError) {
      return { connections: [], count }
    }

    // Format the connections data
    const connections = profiles.map((profile) => ({
      userId: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      profilePictureUrl: profile.profile_picture_url,
    }))

    return { connections, count }
  } catch (error) {
    return { connections: [], count: 0 }
  }
}
