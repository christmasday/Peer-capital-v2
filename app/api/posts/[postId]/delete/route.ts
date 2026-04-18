import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { postId } = await params
  const db = createAdminClient()

  // Check if the post exists and belongs to the user
  const { data: post, error: fetchError } = await db
    .from("posts")
    .select("id, user_id")
    .eq("id", postId)
    .single()

  if (fetchError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  if (post.user_id !== userId) {
    return NextResponse.json({ error: "You can only delete your own posts" }, { status: 403 })
  }

  // Delete the post (cascade will handle comments, likes, reposts)
  const { error: deleteError } = await db
    .from("posts")
    .delete()
    .eq("id", postId)

  if (deleteError) {
    console.error("Error deleting post:", deleteError)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

