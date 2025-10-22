import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"
import { checkSufficientBalance } from "@/lib/utils/balance-checker"

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAuth()
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    
    // Validate required fields
    if (!body.userId || !body.toAddress || !body.amount || !body.asset) {
      return NextResponse.json({ 
        error: "Missing required fields: userId, toAddress, amount, asset" 
      }, { status: 400 })
    }

    // Check wallet balance before initiating withdrawal
    const balanceCheck = await checkSufficientBalance({
      walletAddress: body.fromAddress || body.toAddress, // Need sender's address
      amount: body.amount,
      asset: body.asset,
      network: body.network || "BASE"
    })

    if (!balanceCheck.sufficient) {
      return NextResponse.json({ 
        error: `Insufficient funds. Required: ${balanceCheck.required} (amount: ${body.amount} + gas: ${balanceCheck.gasFee} + platform fee: ${balanceCheck.platformFee}), Available: ${balanceCheck.balance}`,
        code: "INSUFFICIENT_FUNDS",
        details: balanceCheck
      }, { status: 400 })
    }

    const stablesrail = createStablesrailClient()
    const result = await stablesrail.tokenWithdrawal({
      userId: body.userId,
      toAddress: body.toAddress,
      amount: body.amount,
      asset: body.asset,
      destinationWallet: body.destinationWallet,
      network: body.network || "BASE"
    })

    return NextResponse.json({ 
      success: true, 
      data: result 
    })
  } catch (error) {
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 }
      )
    }
    console.error("Error in token-withdrawal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
