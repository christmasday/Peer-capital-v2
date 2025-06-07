import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ enabled: false })
  }
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from("loan_helpers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()
  return NextResponse.json({ enabled: !!data })
}

export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 })
  }
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from("loan_helpers")
    .delete()
    .eq("user_id", userId)
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
} 