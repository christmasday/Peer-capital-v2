import { NextResponse } from "next/server"
import { processLoanRepayments } from "@/lib/actions/loans"

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  const header = req.headers.get("x-cron-secret")
  if (!secret || header !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  await processLoanRepayments()
  return NextResponse.json({ success: true })
} 