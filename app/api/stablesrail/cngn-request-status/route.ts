import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAuth(true)
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const correlationId = searchParams.get('correlationId')
    
    if (!correlationId) {
      return NextResponse.json({ error: "correlationId is required" }, { status: 400 })
    }

    const stablesrail = createStablesrailClient()
    // Use cngnOnrampStatus with the correlationId as requestId
    const result: any = await stablesrail.cngnOnrampStatus({ requestId: correlationId })
    
    return NextResponse.json({ 
      success: true, 
      data: {
        status: result?.status || result?.data?.status,
        transactionHash: result?.transactionHash || result?.data?.transactionHash,
        amount: result?.amount || result?.data?.amount,
        failureReason: result?.failureReason || result?.data?.failureReason
      }
    })
  } catch (error) {
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 },
      )
    }
    console.error("Error fetching transaction status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
