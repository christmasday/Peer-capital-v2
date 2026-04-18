import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

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

    const { walletAddress, requestId, type } = body

    if (!walletAddress && !requestId) {
      return NextResponse.json({ error: "Either walletAddress or requestId is required" }, { status: 400 })
    }

    // If requestId is provided, use the specific status endpoint
    if (requestId) {
      const stablesrail = createStablesrailClient()
      const result: any = type === "offramp"
        ? await stablesrail.cngnOfframpStatus({ requestId })
        : await stablesrail.cngnOnrampStatus({ requestId })
      
      return NextResponse.json({ success: true, data: result })
    }

    // Wallet-address-only: check latest webhook events for this address
    const admin = createAdminClient()
    const { data: latestFunding } = await admin
      .from('webhook_events')
      .select('payload, created_at')
      .in('event_type', ['wallet.funding.success', 'payments.confirmed'])
      .order('created_at', { ascending: false })
      .limit(20)

    if (latestFunding) {
      const match = latestFunding.find((evt: any) => {
        const p = typeof evt.payload === 'string' ? JSON.parse(evt.payload) : evt.payload
        const addr = p?.data?.walletAddress || p?.walletAddress
        return addr?.toLowerCase() === walletAddress?.toLowerCase()
      })
      if (match) {
        const payload = typeof match.payload === 'string' ? JSON.parse(match.payload) : match.payload
        return NextResponse.json({ success: true, data: { status: 'completed', ...payload } })
      }
    }

    return NextResponse.json({ success: true, data: { status: 'pending' } })
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

