import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserId } from "@/lib/auth-utils"
import { v4 as uuidv4 } from "uuid"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { postId } = await params
  const db = createAdminClient()

  // Toggle like: if exists, remove; else insert
  const { data: existing } = await db
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle()

  // Cleaned toggle like logic: only allow insert if like not already exists
  if (existing?.id) {
    await db.from("post_likes").delete().eq("id", existing.id)
    const { data: post } = await db.from("posts").select("likes_count").eq("id", postId).single()
    const next = Math.max(0, (post?.likes_count || 0) - 1)
    await db.from("posts").update({ likes_count: next }).eq("id", postId)
    return NextResponse.json({ liked: false })
  } else {
    // Insert only if not exists; handle error gracefully if violated
    const { error: insertError } = await db.from("post_likes").insert({ 
      id: uuidv4(),
      post_id: postId, 
      user_id: userId 
    })
    if (insertError) {
      console.error(`[Like] Failed to insert:`, insertError)
      return NextResponse.json({ error: "Failed to like post" }, { status: 500 })
    }
    const { data: post } = await db.from("posts").select("likes_count").eq("id", postId).single()
    const next = (post?.likes_count || 0) + 1
    await db.from("posts").update({ likes_count: next }).eq("id", postId)
    return NextResponse.json({ liked: true })
  }
}


