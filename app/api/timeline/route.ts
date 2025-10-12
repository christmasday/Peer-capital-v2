import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    // Get the current user ID using the reliable auth utility
    const authUserId = await getCurrentUserId()
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createAdminClient()

    // Resolve profile using auth user ID (profiles.id == auth user id)
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, first_name")
      .eq("id", authUserId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ posts: [], currentUserId: null, userFirstName: "" })
    }

    const profileId = profile.id
    const userFirstName = profile.first_name || ""

    // Get followed profile IDs
    const { data: following, error: followErr } = await admin
      .from("user_connections")
      .select("following_id")
      .eq("follower_id", profileId)
      .eq("status", "active")

    if (followErr) {
      return NextResponse.json({ posts: [], currentUserId: profileId, userFirstName })
    }

    const followingIds = (following || []).map((f) => f.following_id)
    // Include own posts
    followingIds.push(profileId)

    // Fetch posts by followed users (and self)
    const { data: posts, error } = await admin
      .from("posts")
      .select(`
        id, 
        user_id, 
        content, 
        image_url, 
        image_sizes, 
        created_at, 
        likes_count, 
        comments_count, 
        shares_count
      `)
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ posts: [], currentUserId: profileId, userFirstName })
    }

    // Get profile information for each post
    const postsWithProfiles = await Promise.all(
      (posts || []).map(async (post: any) => {
        const { data: profile } = await admin
          .from("profiles")
          .select("first_name, last_name, profile_picture_url")
          .eq("id", post.user_id)
          .single()
        
        return {
          ...post,
          profiles: profile
        }
      })
    )

    // Format posts for display, marking user interactions
    const formattedPosts = await Promise.all(postsWithProfiles.map(async (post: any) => {
      // Check interactions by current user
      let hasLiked = false
      let hasCommented = false
      let hasReposted = false
      // Like
      const { data: likeRecord } = await admin
        .from("post_likes").select("id").eq("post_id", post.id).eq("user_id", profileId).maybeSingle()
      if (likeRecord?.id) hasLiked = true
      // Comment
      const { data: commentRecord } = await admin
        .from("post_comments").select("id").eq("post_id", post.id).eq("user_id", profileId).maybeSingle()
      if (commentRecord?.id) hasCommented = true
      // Repost
      const { data: repostRecord } = await admin
        .from("reposts").select("id").eq("post_id", post.id).eq("user_id", profileId).maybeSingle()
      if (repostRecord?.id) hasReposted = true
      // Add as top-level keys!
      return {
        id: post.id,
        user_id: post.user_id,
        user_name: `${post.profiles?.first_name || ""} ${post.profiles?.last_name || ""}`.trim(),
        user_image: post.profiles?.profile_picture_url,
        content: post.content,
        image_url: post.image_url,
        image_sizes: post.image_sizes,
        created_at: post.created_at,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        shares_count: post.shares_count || 0,
        hasLiked: !!hasLiked,
        hasCommented: !!hasCommented,
        hasReposted: !!hasReposted,
      }
    }))
    return NextResponse.json({ posts: formattedPosts, currentUserId: profileId, userFirstName })
  } catch {
    return NextResponse.json({ posts: [], currentUserId: null, userFirstName: "" })
  }
}


