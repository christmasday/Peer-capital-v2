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

    // Validate required fields
    if (!body.sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }
    if (!body.otp) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 })
    }
    if (!/^\d{6}$/.test(body.otp)) {
      return NextResponse.json({ error: "OTP must be exactly 6 digits" }, { status: 400 })
    }

    const stablesrail = createStablesrailClient()
    const result: any = await stablesrail.verifyOtp(body)

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
