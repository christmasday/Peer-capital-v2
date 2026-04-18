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

    // Build query for offramp-related webhook events
    // These include vault return payout events (crypto to fiat withdrawals)
    let query = admin
      .from("webhook_events")
      .select("*", { count: "exact" })
      .or("event_type.eq.vault.return.payout.completed,event_type.eq.vault.return.payout.failed,event_type.eq.vault.return.transfer.confirmed,event_type.eq.swaps.completed,event_type.eq.swaps.failed")
      .order("created_at", { ascending: false })

    // Apply search filter if provided
    if (search) {
      query = query.or(`payload->>requestId.ilike.%${search}%,payload->>userId.ilike.%${search}%,payload->>idempotencyKey.ilike.%${search}%,payload->>transactionId.ilike.%${search}%`)
    }

    // Get total count first
    const { count } = await query

    // Apply pagination
    const { data: events, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching offramp requests:", error)
      return NextResponse.json({ error: "Failed to fetch offramp requests" }, { status: 500 })
    }

    // Transform events into a more usable format
    const offrampRequests = (events || []).map((event: any) => {
      const payload = typeof event.payload === "string" ? JSON.parse(event.payload) : event.payload
      
      // Extract data from payload based on event type
      const eventData = payload?.data || payload?.payload || payload
      
      return {
        id: event.id,
        eventType: event.event_type,
        requestId: eventData?.requestId || eventData?.transactionId || eventData?.idempotencyKey || null,
        userId: eventData?.userId || eventData?.matchedUserId || null,
        amount: eventData?.amount || eventData?.amountNgn || null,
        tokenAmount: eventData?.tokenAmount || eventData?.amountCngn || null,
        currency: eventData?.currency || "NGN",
        status: getStatusFromEventType(event.event_type, eventData),
        walletAddress: eventData?.walletAddress || eventData?.senderAddress || null,
        transactionHash: eventData?.transactionHash || eventData?.txHash || null,
        bankAccountNumber: eventData?.bankAccountNumber || eventData?.accountNumber || null,
        bankAccountName: eventData?.bankAccountName || eventData?.accountName || null,
        bankName: eventData?.bankName || null,
        bankCode: eventData?.bankCode || null,
        network: eventData?.network || "BASE",
        failureReason: eventData?.failureReason || eventData?.reason || eventData?.error || null,
        processed: event.processed,
        createdAt: event.created_at,
        rawPayload: payload,
      }
    })

    // Apply status filter after transformation if needed
    let filteredRequests = offrampRequests
    if (status && status !== "all") {
      filteredRequests = offrampRequests.filter((r: any) => r.status === status)
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
    console.error("Error in offramp-requests API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getStatusFromEventType(eventType: string, eventData?: any): string {
  switch (eventType) {
    case "vault.return.payout.completed":
    case "swaps.completed":
      return "completed"
    case "vault.return.payout.failed":
    case "swaps.failed":
      return "failed"
    case "vault.return.transfer.confirmed":
      return "transfer_confirmed"
    default:
      // Check if there's a status field in the payload
      if (eventData?.status) {
        return eventData.status.toLowerCase()
      }
      return "pending"
  }
}
