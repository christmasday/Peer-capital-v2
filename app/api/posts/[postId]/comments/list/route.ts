import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { postId } = await params
  const db = createAdminClient()

  // Fetch comments for this post
  const { data: comments, error } = await db
    .from("post_comments")
    .select("id, user_id, content, created_at, likes_count")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ comments: [] })
  }

  // Get profile information for each comment
  const commentsWithProfiles = await Promise.all(
    (comments || []).map(async (comment: any) => {
      const { data: profile } = await db
        .from("profiles")
        .select("first_name, last_name, profile_picture_url")
        .eq("id", comment.user_id)
        .single()
      
      return {
        ...comment,
        user_name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
        user_image: profile?.profile_picture_url,
      }
    })
  )

  return NextResponse.json({ comments: commentsWithProfiles })
}

