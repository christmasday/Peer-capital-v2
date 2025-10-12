import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    
    // Basic validation
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const stablesrail = createStablesrailClient()
    const result: any = await stablesrail.verifyOtp(body)

    // Save sr_user_id and mark BVN verified if applicable
    const admin = createAdminClient()
    try {
      const userIdToSave = result?.userId || result?.data?.userId
      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (userIdToSave) {
        updates.sr_user_id = String(userIdToSave)
      }
      if (result?.verified === true || result?.data?.verified === true) {
        updates.bvn_verified = true
        updates.bvn_verified_at = new Date().toISOString()
      }
      if (Object.keys(updates).length > 0) {
        await admin.from("profiles").update(updates).eq("id", authResult.userId)
      }

      // Create confirmation notification
      await admin.from("notifications").insert({
        id: crypto.randomUUID(),
        user_id: authResult.userId,
        actor_id: authResult.userId,
        type: (result?.verified || result?.data?.verified) ? "verification_completed" : "verification_started",
        data: { provider: "stablesrail", payload: result },
        read: false,
        created_at: new Date().toISOString(),
      })
    } catch (_) { /* Non-blocking */ }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 }
      )
    }
    
    console.error("Error in verify-otp:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
