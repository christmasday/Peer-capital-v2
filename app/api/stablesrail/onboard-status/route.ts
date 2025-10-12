import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const reference = searchParams.get("reference")

    // Basic validation
    if (!userId && !reference) {
      return NextResponse.json({ error: "userId or reference is required" }, { status: 400 })
    }

    const stablesrail = createStablesrailClient()
    const result = await stablesrail.getOnboardStatus({ 
      userId: userId || undefined, 
      reference: reference || undefined 
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 }
      )
    }
    
    console.error("Error in onboard-status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
