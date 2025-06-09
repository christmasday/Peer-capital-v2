import { NextRequest, NextResponse } from "next/server"
import { transferFromAccount } from "@/lib/actions/account"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const result = await transferFromAccount(body)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json(result)
} 