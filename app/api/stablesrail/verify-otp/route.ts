import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyOtpSchema } from "@/lib/stablesrail/schemas"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Normalize field names before validation
    const normalizedBody = {
      code: body.code || body.otp,
      sessionId: body.sessionId || body.requestId
    }

    // Validate request using Zod schema
    const parseResult = verifyOtpSchema.safeParse(normalizedBody)
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors
      return NextResponse.json({ 
        error: "Validation failed", 
        fieldErrors 
      }, { status: 400 })
    }

    const validatedBody = parseResult.data

    const stablesrail = createStablesrailClient()
    // Forward exactly what Stablesrail expects
    const result: any = await stablesrail.verifyOtp(validatedBody)

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
