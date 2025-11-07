import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Basic validation
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Accept both naming conventions: { code, sessionId } or { otp, requestId }
    const sessionId: string | undefined = body.sessionId || body.requestId
    const code: string | undefined = body.code || body.otp
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    }
    if (!code) {
      return NextResponse.json({ error: "code is required" }, { status: 400 })
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "code must be exactly 6 digits" }, { status: 400 })
    }

    const stablesrail = createStablesrailClient()
    // Forward exactly what Stablesrail expects
    const result: any = await stablesrail.verifyOtp({ code, sessionId })

    // Extract userId from response
    const userId = result?.userId || result?.data?.userId

    return NextResponse.json({ 
      success: true, 
      data: result,
      userId: userId 
    })
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
