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
    const result = await stablesrail.onboardUser(body)

    // Try to persist correlation/request id on profile for tracking
    try {
      const admin = createAdminClient()
      const requestId = (result as any)?.requestId || (result as any)?.data?.requestId
      if (requestId) {
        await admin
          .from("profiles")
          .update({ correlation_id: String(requestId), updated_at: new Date().toISOString() })
          .eq("id", authResult.userId)
      }
    } catch (_) {
      // non-blocking
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 }
      )
    }
    
    console.error("Error in onboard-user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
