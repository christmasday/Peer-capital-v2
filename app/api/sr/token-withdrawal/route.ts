import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkSufficientBalance } from "@/lib/utils/balance-checker"
import { tokenWithdrawalSchema } from "@/lib/stablesrail/schemas"

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

    // Fetch the user's StablesRail user ID from their profile
    const admin = createAdminClient()
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("sr_user_id")
      .eq("id", auth.userId)
      .maybeSingle()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error fetching user profile:", profileError)
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
    }

    const srUserId = profile?.sr_user_id
    if (!srUserId) {
      return NextResponse.json({
        error: "StablesRail account not found. Please complete your account setup first."
      }, { status: 400 })
    }

    // Build payload with the correct StablesRail user ID
    const withdrawalPayload = {
      userId: srUserId,
      internalWallet: body.internalWallet,
      destinationWallet: body.destinationWallet,
      amount: body.amount,
      ticker: body.ticker || 'CNGN',
      ...(body.network && { network: body.network }),
    }

    // Validate request using Zod schema
    const parseResult = tokenWithdrawalSchema.safeParse(withdrawalPayload)
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors
      return NextResponse.json({ 
        error: "Validation failed", 
        fieldErrors 
      }, { status: 400 })
    }

    const validatedBody = parseResult.data

    // Check wallet balance before initiating withdrawal
    const balanceCheck = await checkSufficientBalance({
      walletAddress: validatedBody.internalWallet,
      amount: validatedBody.amount,
      asset: validatedBody.ticker,
      network: validatedBody.network || "BASE"
    })

    if (!balanceCheck.sufficient) {
      return NextResponse.json({ 
        error: `Insufficient funds. Required: ${balanceCheck.required} (amount: ${validatedBody.amount} + gas: ${balanceCheck.gasFee} + platform fee: ${balanceCheck.platformFee}), Available: ${balanceCheck.balance}`,
        code: "INSUFFICIENT_FUNDS",
        details: balanceCheck
      }, { status: 400 })
    }

    const stablesrail = createStablesrailClient()
    const result = await stablesrail.tokenWithdrawal(validatedBody)

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
