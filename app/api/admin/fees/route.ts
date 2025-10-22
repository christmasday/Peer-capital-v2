import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated || !authResult.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data: fees, error } = await adminClient
      .from("admin_fees")
      .select("*")
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const feeMap = {
      lender_fee: fees?.find(f => f.fee_type === 'lender_fee')?.percentage || 1.5,
      borrower_fee: fees?.find(f => f.fee_type === 'borrower_fee')?.percentage || 1.5
    }

    return NextResponse.json({ success: true, fees: feeMap })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated || !authResult.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { lender_fee, borrower_fee } = body

    if (typeof lender_fee !== 'number' || lender_fee < 0 || lender_fee > 10) {
      return NextResponse.json({ error: "Invalid lender fee" }, { status: 400 })
    }

    if (typeof borrower_fee !== 'number' || borrower_fee < 0 || borrower_fee > 10) {
      return NextResponse.json({ error: "Invalid borrower fee" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    
    // Update lender fee
    await adminClient
      .from("admin_fees")
      .update({ 
        percentage: lender_fee,
        updated_at: new Date().toISOString(),
        updated_by: authResult.userId
      })
      .eq("fee_type", "lender_fee")
    
    // Update borrower fee
    await adminClient
      .from("admin_fees")
      .update({ 
        percentage: borrower_fee,
        updated_at: new Date().toISOString(),
        updated_by: authResult.userId
      })
      .eq("fee_type", "borrower_fee")

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
