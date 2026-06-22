import { NextRequest, NextResponse } from "next/server"
import { StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await checkAuth()
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId") || authResult.userId
    const accountNumber = searchParams.get("accountNumber")

    const admin = createAdminClient()
    // Prefer lookup by user_id; fallback to account_number if provided
    let query = admin.from('virtual_accounts').select('*').limit(1)
    if (accountNumber) {
      query = query.eq('account_number', accountNumber)
    } else if (userId) {
      query = query.eq('user_id', userId as string)
    }
    const { data, error } = await query.single()
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch virtual account' }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 }
      )
    }
    
    console.error("Error in virtual-account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await checkAuth()
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json()
    if (!body || typeof body !== 'object' || !body.requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 })
    }

    const requestId = String(body.requestId)
    const admin = createAdminClient()

    // Check webhook_events for virtual.account.created with matching requestId
    const { data: events } = await admin
      .from('webhook_events')
      .select('payload, created_at')
      .eq('event_type', 'virtual.account.created')
      .order('created_at', { ascending: false })
      .limit(10)

    let matchedEvent: any = null
    if (events) {
      matchedEvent = events.find((evt: any) => {
        const p = typeof evt.payload === 'string' ? JSON.parse(evt.payload) : evt.payload
        return p?.requestId === requestId
      })
    }

    if (matchedEvent) {
      const payload = typeof matchedEvent.payload === 'string' ? JSON.parse(matchedEvent.payload) : matchedEvent.payload
      const vaPayload = payload?.payload || {}

      const vaRecord = {
        user_id: authResult.userId as string,
        email: '',
        account_number: String(vaPayload.accountNumber || ''),
        account_name: String(vaPayload.accountName || ''),
        bank_name: String(vaPayload.bankName || 'Strails'),
        bank_code: 'STRAILS',
        currency: 'NGN',
        assigned: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: vaData } = await admin
        .from('virtual_accounts')
        .upsert(vaRecord, { onConflict: 'user_id' })
        .select()
        .single()

      return NextResponse.json({
        success: true,
        data: {
          virtualAccount: {
            accountNumber: vaPayload.accountNumber,
            accountName: vaPayload.accountName,
            bankName: vaPayload.bankName,
            vaId: vaPayload.vaId,
          },
          requestId,
        },
        persisted: { virtualAccount: vaData },
      })
    }

    // No webhook event found yet — return pending
    return NextResponse.json({
      success: true,
      data: { status: 'pending', requestId },
      persisted: null,
    })
  } catch (error) {
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 }
      )
    }
    console.error("Error in virtual-account POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
