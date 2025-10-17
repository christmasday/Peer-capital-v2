import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
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
    const stablesrail = createStablesrailClient()
    const result: any = await stablesrail.getVirtualAccountByRequestId({ requestId: String(body.requestId) })

    // Persist to virtual_accounts table if a virtualAccount is returned
    let virtualAccount = null
    let wallet = null
    
    try {
      const admin = createAdminClient()
      const data = (result && (result.data || result)) || {}
      const va = data.virtualAccount || null
      const requestId: string | undefined = data.requestId
      const walletAddress = data.walletAddress || null

      if (va && requestId) {
        const vaRecord = {
          user_id: authResult.userId as string,
          account_number: String(va.accountNumber || ''),
          account_name: String(va.accountName || ''),
          bank_name: 'Stablesrail',
          bank_code: 'STABLESRAIL',
          currency: String(va.currency || 'NGN'),
          assigned: Boolean(va.accountStatus ?? true),
          request_id: String(requestId),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email: null as string | null,
        }

        // Upsert keyed by user_id to keep a single VA per user in our table
        const { data: vaData } = await admin.from('virtual_accounts').upsert(vaRecord, { onConflict: 'user_id' }).select().single()
        virtualAccount = vaData

        // Persist wallet address if available
        if (walletAddress) {
          const walletRecord = {
            user_id: authResult.userId as string,
            wallet_address: String(walletAddress),
            request_id: String(requestId),
            account_number: String(va.accountNumber || ''),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          // Upsert wallet address (one per user)
          const { data: walletData } = await admin.from('wallet_address').upsert(walletRecord, { onConflict: 'user_id' }).select().single()
          wallet = walletData
        }
      }
    } catch (error) {
      console.error("Error persisting virtual account or wallet:", error)
      // non-blocking persistence
    }

    return NextResponse.json({ 
      success: true, 
      data: result, 
      persisted: { 
        virtualAccount, 
        wallet 
      } 
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
