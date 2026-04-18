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
    const userId = searchParams.get("userId")

    // Basic validation
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const stablesrail = createStablesrailClient()
    const result: any = await stablesrail.getUserDetails({ userId })

    // Persist virtual account and wallet address to DB
    if (result && result.virtualAccount) {
      const admin = createAdminClient()
      
      // Save virtual account
      const vaRecord = {
        user_id: authResult.userId,
        account_number: result.virtualAccount.accountNumber,
        account_name: result.virtualAccount.accountName,
        bank_name: 'Stablesrail',
        bank_code: 'STABLESRAIL',
        currency: result.virtualAccount.currency || 'NGN',
        assigned: true,
        request_id: result.requestId || '',
        updated_at: new Date().toISOString(),
        email: null,
      }
      
      await admin.from('virtual_accounts').upsert(vaRecord, { onConflict: 'user_id' })
      
      // Save wallet address if available
      if (result.walletAddress) {
        const walletRecord = {
          user_id: authResult.userId,
          wallet_address: result.walletAddress,
          request_id: result.requestId || '',
          account_number: result.virtualAccount.accountNumber,
          updated_at: new Date().toISOString(),
        }
        
        await admin.from('wallet_address').upsert(walletRecord, { onConflict: 'user_id' })
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: result,
      virtualAccount: result?.virtualAccount 
    })
  } catch (error) {
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 }
      )
    }
    
    console.error("Error in user-details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
