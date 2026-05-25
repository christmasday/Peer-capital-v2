import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/auth-utils"
import { respondToLoanOffer } from "@/lib/actions/loan-offers"

export async function POST(
  request: NextRequest,
  { params }: { params: { loanRequestId: string } },
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "You must be logged in to respond to this offer" }, { status: 401 })
    }

    const body = await request.json()
    const decision = body.decision === "accept" ? "accept" : body.decision === "reject" ? "reject" : null

    if (!decision) {
      return NextResponse.json({ error: "Decision must be accept or reject" }, { status: 400 })
    }

    const result = await respondToLoanOffer({
      loanRequestId: params.loanRequestId,
      decision,
      userId,
    })

    if (!result.success) {
      return NextResponse.json({ error: "Failed to update offer" }, { status: 400 })
    }

    return NextResponse.json({ success: true, status: result.status })
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
