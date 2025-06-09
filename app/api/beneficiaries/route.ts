import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyAuth } from "@/lib/auth-middleware"

export async function GET(req: NextRequest) {
  const auth: any = await verifyAuth(req)
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  const userId = auth.userId
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("transfer_beneficiaries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ beneficiaries: data })
}

export async function POST(req: NextRequest) {
  const auth: any = await verifyAuth(req)
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  const userId = auth.userId
  const admin = createAdminClient()
  const body = await req.json()
  const { account_name, account_number, bank_name, bank_code, recipient_code } = body
  if (!account_name || !account_number || !bank_name || !bank_code || !recipient_code) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  const { data, error } = await admin.from("transfer_beneficiaries").insert({
    user_id: userId,
    account_name,
    account_number,
    bank_name,
    bank_code,
    recipient_code,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).select().single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ beneficiary: data })
}

export async function DELETE(req: NextRequest) {
  const auth: any = await verifyAuth(req)
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  const userId = auth.userId
  const admin = createAdminClient()
  const body = await req.json()
  const { id } = body
  if (!id) {
    return NextResponse.json({ error: "Missing beneficiary id" }, { status: 400 })
  }
  const { error } = await admin.from("transfer_beneficiaries").delete().eq("id", id).eq("user_id", userId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
} 