import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserId } from "@/lib/auth-utils"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { postId } = await params
  const db = createAdminClient()

  const { content } = await req.json().catch(() => ({ content: "" }))
  const text = String(content || "").trim()
  if (!text) return NextResponse.json({ error: "Content required" }, { status: 400 })

  // Check post exists
  const { data: postExists } = await db.from("posts").select("id").eq("id", postId).maybeSingle()
  if (!postExists) return NextResponse.json({ error: "Post not found" }, { status: 404 })

  // Insert comment
  const { error: insertError } = await db.from("post_comments").insert({ 
    id: uuidv4(),
    post_id: postId, 
    user_id: userId, 
    content: text 
  })
  if (insertError) {
    // Log server-side for debugging
    console.error("Error inserting comment:", insertError)
    // Better error for user
    if ((insertError.message || "").toLowerCase().includes("duplicate") || insertError.message.includes('unique')) {
      return NextResponse.json({ error: "You have already commented on this post." }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to comment" }, { status: 500 })
  }

  const { data: post } = await db.from("posts").select("comments_count").eq("id", postId).single()
  const next = (post?.comments_count || 0) + 1
  await db.from("posts").update({ comments_count: next }).eq("id", postId)

  return NextResponse.json({ success: true })
}


