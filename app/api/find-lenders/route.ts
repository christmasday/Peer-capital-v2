import { NextRequest, NextResponse } from "next/server"
import { findLenders } from "@/lib/actions/find-lenders"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { loanAmount, loanDuration, loanDurationUnit, page, pageSize } = body
    const result = await findLenders({ loanAmount, loanDuration, loanDurationUnit, page, pageSize })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ lenders: [], error: "An unexpected error occurred" }, { status: 500 })
  }
} 