import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkAdminAuth } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const adminAuth = await checkAdminAuth()
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") // pending, completed, failed
    const search = searchParams.get("search") // search by user ID or request ID

    const offset = (page - 1) * limit

    const admin = createAdminClient()

    // Build query for onramp-related webhook events
    let query = admin
      .from("webhook_events")
      .select("*", { count: "exact" })
      .or("event_type.eq.payments.confirmed,event_type.eq.wallet.funding.success,event_type.eq.wallet.funding.completed")
      .order("created_at", { ascending: false })

    // Apply search filter if provided
    if (search) {
      query = query.or(`payload->>requestId.ilike.%${search}%,payload->>userId.ilike.%${search}%,payload->>txRef.ilike.%${search}%`)
    }

    // Get total count first
    const { count } = await query

    // Apply pagination
    const { data: events, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching onramp requests:", error)
      return NextResponse.json({ error: "Failed to fetch onramp requests" }, { status: 500 })
    }

    // Transform events into a more usable format
    const onrampRequests = (events || []).map((event: any) => {
      const payload = typeof event.payload === "string" ? JSON.parse(event.payload) : event.payload
      
      // Extract data from payload based on event type
      const eventData = payload?.data || payload?.payload || payload
      
      return {
        id: event.id,
        eventType: event.event_type,
        requestId: eventData?.requestId || eventData?.txRef || null,
        userId: eventData?.userId || eventData?.matchedUserId || null,
        amount: eventData?.amount || null,
        currency: eventData?.currency || "NGN",
        status: getStatusFromEventType(event.event_type),
        walletAddress: eventData?.walletAddress || null,
        transactionHash: eventData?.transactionHash || null,
        accountNumber: eventData?.accountNumber || null,
        senderName: eventData?.senderName || null,
        network: eventData?.network || "BASE",
        tokenAddress: eventData?.tokenAddress || null,
        processed: event.processed,
        createdAt: event.created_at,
        rawPayload: payload,
      }
    })

    // Apply status filter after transformation if needed
    let filteredRequests = onrampRequests
    if (status && status !== "all") {
      filteredRequests = onrampRequests.filter((r: any) => r.status === status)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      data: filteredRequests,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: totalPages,
      },
    })
  } catch (error) {
    console.error("Error in onramp-requests API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getStatusFromEventType(eventType: string): string {
  switch (eventType) {
    case "payments.confirmed":
      return "payment_confirmed"
    case "wallet.funding.success":
    case "wallet.funding.completed":
      return "completed"
    default:
      return "pending"
  }
}
