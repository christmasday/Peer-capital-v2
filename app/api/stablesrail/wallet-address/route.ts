import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAuth()
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createAdminClient()

    // Get wallet addresses for the current user
    const { data: walletAddresses, error } = await admin
      .from('wallet_address')
      .select(`
        id,
        user_id,
        wallet_address,
        base_address,
        ethereum_address,
        polygon_address,
        bnb_address,
        asset_chain_address,
        bantu_address,
        request_id,
        account_number,
        created_at,
        updated_at
      `)
      .eq('user_id', auth.userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No wallet addresses found
        return NextResponse.json({ 
          error: "No wallet addresses found for user",
          success: false 
        }, { status: 404 })
      }
      
      console.error('Error fetching wallet addresses:', error)
      return NextResponse.json({ 
        error: "Failed to fetch wallet addresses",
        success: false 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      walletAddresses: walletAddresses
    })
  } catch (error) {
    console.error("Error in wallet-address GET:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      success: false 
    }, { status: 500 })
  }
}
