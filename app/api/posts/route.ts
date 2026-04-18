import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function POST(req: NextRequest) {
  try {
    // Get the current user ID using the reliable auth utility
    const authUserId = await getCurrentUserId()
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const content = formData.get("content") as string

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Resolve profile using auth user ID (profiles.id == auth user id)
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .eq("id", authUserId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const profileId = profile.id

    // Create the post
    const { data: post, error: postError } = await admin
      .from("posts")
      .insert([
        {
          user_id: profileId,
          content: content.trim(),
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
        },
      ])
      .select()
      .single()

    if (postError) {
      console.error("Error creating post:", postError)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error("Unexpected error creating post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
