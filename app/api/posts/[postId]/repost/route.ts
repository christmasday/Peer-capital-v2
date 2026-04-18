import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserId } from "@/lib/auth-utils"
import { v4 as uuidv4 } from "uuid"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { postId } = await params
  const db = createAdminClient()

  // Check if user already reposted
  const { data: existing } = await db
    .from("reposts")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle()

  // Toggle repost: if exists, remove; else insert
  if (existing?.id) {
    await db.from("reposts").delete().eq("id", existing.id)
    const { data: post } = await db.from("posts").select("shares_count").eq("id", postId).single()
    const next = Math.max(0, (post?.shares_count || 0) - 1)
    await db.from("posts").update({ shares_count: next }).eq("id", postId)
    return NextResponse.json({ reposted: false })
  } else {
    const { error: insertError } = await db.from("reposts").insert({ 
      id: uuidv4(),
      post_id: postId, 
      user_id: userId 
    })
    if (insertError) {
      console.error(`[Repost] Failed to insert:`, insertError)
      return NextResponse.json({ error: "Failed to repost" }, { status: 500 })
    }
    const { data: post } = await db.from("posts").select("shares_count").eq("id", postId).single()
    const next = (post?.shares_count || 0) + 1
    await db.from("posts").update({ shares_count: next }).eq("id", postId)
    return NextResponse.json({ reposted: true })
  }
}


