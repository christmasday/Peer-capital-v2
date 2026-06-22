import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAuth(true)
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const requestId = searchParams.get("requestId")

    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Resolve the user's SR user ID for scoping queries
    const { data: userProfile } = await admin
      .from('profiles')
      .select('sr_user_id')
      .eq('id', auth.userId)
      .maybeSingle()

    if (!userProfile?.sr_user_id) {
      return NextResponse.json({ error: "StablesRail account not found" }, { status: 400 })
    }

    // Check for webhook events related to this requestId, scoped to this user
    const { data: paymentEvents } = await admin
      .from('webhook_events')
      .select('*')
      .eq('event_type', 'payments.confirmed')
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: fundingEvents } = await admin
      .from('webhook_events')
      .select('*')
      .eq('event_type', 'wallet.funding.completed')
      .order('created_at', { ascending: false })
      .limit(10)

    // Check if any event matches the requestId
    let paymentConfirmed = false
    let fundingCompleted = false
    let paymentEvent = null
    let fundingEvent = null

    if (paymentEvents) {
      paymentEvent = paymentEvents.find((event: any) => {
        const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload
        // Match on requestId/reference AND verify it belongs to this user
        const matchesRequest = payload.requestId === requestId || payload.reference === requestId
        const matchesUser = payload.userId === userProfile.sr_user_id || payload.data?.userId === userProfile.sr_user_id
        return matchesRequest && matchesUser
      })
      paymentConfirmed = !!paymentEvent
    }

    if (fundingEvents) {
      fundingEvent = fundingEvents.find((event: any) => {
        const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload
        return payload.requestId === requestId
      })
      fundingCompleted = !!fundingEvent
    }

    // Also check virtual account to see if it exists and get wallet address
    const { data: vaData } = await admin
      .from('virtual_accounts')
      .select('*')
      .eq('request_id', requestId)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        paymentConfirmed,
        fundingCompleted,
        completed: paymentConfirmed && fundingCompleted,
        paymentEvent: paymentEvent ? (typeof paymentEvent.payload === 'string' ? JSON.parse(paymentEvent.payload) : paymentEvent.payload) : null,
        fundingEvent: fundingEvent ? (typeof fundingEvent.payload === 'string' ? JSON.parse(fundingEvent.payload) : fundingEvent.payload) : null,
        virtualAccount: vaData || null
      }
    })
  } catch (error) {
    console.error("Error in funding-status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

