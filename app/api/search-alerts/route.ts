import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-utils"
import { saveSearchAlertSubscription, type SearchAlertCriteria } from "@/lib/actions/search-alerts"

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuth()
    if (!auth?.authenticated || !auth.userId) {
      return NextResponse.json({ error: "You must be logged in to save search alerts" }, { status: 401 })
    }

    const body = await request.json()
    const searchKind = body.searchKind === "loan_request_search" ? "loan_request_search" : "lender_search"
    const criteria: SearchAlertCriteria = {
      loanAmount: typeof body.loanAmount === "number" ? body.loanAmount : undefined,
      loanDuration: typeof body.loanDuration === "number" ? body.loanDuration : undefined,
      loanDurationUnit: body.loanDurationUnit === "days" ? "days" : "months",
    }

    if (!criteria.loanAmount && !criteria.loanDuration) {
      return NextResponse.json({ error: "Search criteria are required" }, { status: 400 })
    }

    const result = await saveSearchAlertSubscription({
      userId: auth.userId,
      searchKind,
      criteria,
    })

    if (!result.success) {
      return NextResponse.json({ error: "Failed to save search alert" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      expiresInDays: 7,
    })
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}