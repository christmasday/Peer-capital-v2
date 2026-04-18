import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { cngnOfframpSchema } from "@/lib/stablesrail/schemas"

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

    // Build the offramp payload with the StablesRail user ID
    // Required fields: userId, amount, accountNumber, bankCode, ticker
    const offrampPayload = {
      userId: srUserId, // Use the StablesRail user ID from profile
      amount: body.amount,
      accountNumber: body.accountNumber,
      bankCode: body.bankCode,
      ticker: body.ticker || 'CNGN', // Default to CNGN if not provided
    }

    // Validate request using Zod schema
    const parseResult = cngnOfframpSchema.safeParse(offrampPayload)
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors
      return NextResponse.json({ 
        error: "Validation failed", 
        fieldErrors 
      }, { status: 400 })
    }

    const validatedPayload = parseResult.data

    const stablesrail = createStablesrailClient()
    const result = await stablesrail.cngnOfframp(validatedPayload)
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 },
      )
    }
    console.error("Error in cngn-offramp:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
