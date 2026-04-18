import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const admin = createAdminClient()

    // Update the user's profile
    const { data, error } = await admin
      .from('profiles')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authResult.userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating profile:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: "Profile updated successfully" 
    })
  } catch (error) {
    console.error("Error in user-profile PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
