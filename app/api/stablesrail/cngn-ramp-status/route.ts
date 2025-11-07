import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAuth(true)
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { walletAddress, requestId } = body

    if (!walletAddress && !requestId) {
      return NextResponse.json({ error: "Either walletAddress or requestId is required" }, { status: 400 })
    }

    const stablesrail = createStablesrailClient()
    const result: any = await stablesrail.cngnRampStatus({
      walletAddress,
      requestId
    })
    
    return NextResponse.json({ 
      success: true, 
      data: result
    })
  } catch (error) {
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 },
      )
    }
    console.error("Error in cngn-ramp-status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

