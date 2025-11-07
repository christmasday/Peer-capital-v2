import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"

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

    // Validate required fields
    const { userId, amount, accountNumber, bankCode, ticker  } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 })
    }

    if (!ticker || typeof ticker !== "string") {
      return NextResponse.json({ error: "ticker is required" }, { status: 400 })
    }

    if (!bankCode || typeof bankCode !== "string") {
      return NextResponse.json({ error: "bankCode is required" }, { status: 400 })
    }

    if (!accountNumber || typeof accountNumber !== "string") {
      return NextResponse.json({ error: "accountNumber is required" }, { status: 400 })
    }

  

    // Prepare payload for Stablesrail
    const payload = {
      userId,
      amount,
      accountNumber,
      bankCode,
      ticker: ticker || "CNGN",
    }

    const stablesrail = createStablesrailClient()
    const result = await stablesrail.cngnOfframp(payload)
    
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
