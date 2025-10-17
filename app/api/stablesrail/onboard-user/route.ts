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

    // Validate BVN if provided
    if (body.bvn && !/^\d{11}$/.test(body.bvn)) {
      return NextResponse.json({ error: "BVN must be exactly 11 digits" }, { status: 400 })
    }

    const stablesrail = createStablesrailClient()
    const result = await stablesrail.onboardUser(body)

    // Extract requestId from response
    const requestId = (result as any)?.requestId || (result as any)?.data?.requestId

    return NextResponse.json({ 
      success: true, 
      data: result,
      requestId: requestId 
    })
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
