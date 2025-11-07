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

    if (!body.userId || !body.amount) {
      return NextResponse.json({ error: "userId and amount are required" }, { status: 400 })
    }

    // Fetch user's base wallet address from wallet_address table
    const admin = createAdminClient()
    const { data: walletAddress, error: walletError } = await admin
      .from("wallet_address")
      .select("base_address")
      .eq("user_id", auth.userId)
      .maybeSingle()
    
    if (walletError && walletError.code !== 'PGRST116') {
      console.error("Error fetching user wallet address:", walletError)
      return NextResponse.json({ error: "Failed to fetch user wallet address" }, { status: 500 })
    }

    const userBaseWalletAddress = walletAddress?.base_address
    if (!userBaseWalletAddress) {
      return NextResponse.json({ 
        error: "Base wallet address not found. Please ensure your wallet is set up first." 
      }, { status: 400 })
    }

    const stablesrail = createStablesrailClient()
    const result: any = await stablesrail.cngnOnramp({
      userId: body.userId,
      amount: body.amount,
      owner: userBaseWalletAddress, // Use user's base wallet address as owner
      network: body.network || "BASE",
      assetSwap: "CNGN",
      autoSwap: false
    })
    
    // Extract requestId from response
    const requestId = result?.requestId || result?.data?.requestId
    
    return NextResponse.json({ 
      success: true, 
      data: {
        requestId: requestId,
        walletAddress: result?.walletAddress || result?.data?.walletAddress,
        status: result?.status || result?.data?.status,
        message: result?.message || result?.data?.message,
        feeBreakdown: result?.feeBreakdown || result?.data?.feeBreakdown,
        version: result?.version || result?.data?.version,
        autoSwapEnabled: result?.autoSwapEnabled || result?.data?.autoSwapEnabled,
        targetAsset: result?.targetAsset || result?.data?.targetAsset,
        amount: body.amount,
        network: body.network || "BASE"
      }
    })
  } catch (error) {
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 },
      )
    }
    console.error("Error in cngn-onramp:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
