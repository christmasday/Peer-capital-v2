import { NextRequest, NextResponse } from "next/server"
import { transferFromAccount } from "@/lib/actions/account"
import { verifyAuth } from "@/lib/auth-middleware"

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req) as any
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json({ error: "You must be logged in to transfer from your account" }, { status: 401 })
  }
  const body = await req.json()
  const result = await transferFromAccount({ ...body, userId: auth.userId })
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json(result)
} 