import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if (!authResult.authenticated || !authResult.userId) {
      console.error('🔴 [API] Authentication failed:', { authenticated: authResult.authenticated, userId: authResult.userId })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log('🟢 [API] Authentication successful:', { userId: authResult.userId })

    const body = await req.json().catch(() => ({})) as { requestId?: string }
    const requestId = body.requestId

    if (!requestId) {
      return NextResponse.json({ error: "requestId is required in the request body" }, { status: 400 })
    }

    console.log('🟢 [API] onboard-status called with requestId:', requestId)

    const stablesrail = createStablesrailClient()
    const result = await stablesrail.getOnboardStatus({ requestId })

    console.log('🟢 [API] onboard-status result:', JSON.stringify(result, null, 2))
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof StablesrailError) {
      console.error('🔴 [API] StablesrailError:', error.message, error.responseCode, error.details)
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 }
      )
    }
    
    console.error("🔴 [API] Error in onboard-status:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage, details: error instanceof Error ? error.stack : undefined }, { status: 500 })
  }
}
