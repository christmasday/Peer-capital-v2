import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAuth()
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const correlationId = searchParams.get("correlationId")
    if (!correlationId) {
      return NextResponse.json({ error: "correlationId is required" }, { status: 400 })
    }

    const stablesrail = createStablesrailClient()
    const result = await stablesrail.getCngnRequestStatus({ correlationId })
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 },
      )
    }
    console.error("Error in transaction-status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
