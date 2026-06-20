import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { cngnOnrampSchema } from "@/lib/stablesrail/schemas"

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

    // Prepare payload for StablesRail
    const fullPayload = {
      userId: srUserId,
      amount: body.amount,
      sweepToOfframp: true
    }

    // Validate request using Zod schema
    const parseResult = cngnOnrampSchema.safeParse(fullPayload)
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors
      return NextResponse.json({ 
        error: "Validation failed", 
        fieldErrors 
      }, { status: 400 })
    }

    const validatedPayload = parseResult.data

    const stablesrail = createStablesrailClient()
    const result: any = await stablesrail.cngnOnramp(validatedPayload)
    
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
