import { NextRequest, NextResponse } from "next/server"
import { createLoanRequest } from "@/lib/actions/loans"
import { checkAuth } from "@/lib/auth-utils"

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 10)

  try {
  
    const auth = await checkAuth()
    console.log(`[${requestId}] Auth result from checkAuth:`, auth)
    if (!auth?.authenticated || !auth.userId) {
      console.log(`[${requestId}] Returning 401 error`)
      return NextResponse.json({ error: "You must be logged in to request a loan" }, { status: 401 })
    }
    const body = await req.json()
    const { helperId, amount, duration, durationUnit, purpose, purposeDetails, interestRate } = body
    const result = await createLoanRequest({
      userId: auth.userId,
      helperId,
      amount,
      duration,
      durationUnit,
      purpose,
      purposeDetails,
      interestRate,
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 