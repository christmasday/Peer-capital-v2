import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()
    if (!reference) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 })
    }

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Paystack secret key not configured" }, { status: 500 })
    }

    // Call Paystack verify transaction API
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    })
    const paystackData = await paystackRes.json()

    if (!paystackData.status) {
      return NextResponse.json({ error: paystackData.message || "Failed to verify transaction" }, { status: 400 })
    }

    const txStatus = paystackData.data.status // 'success', 'failed', etc.

    // Map Paystack status to local status
    let newStatus = null
    if (txStatus === "success") newStatus = "completed"
    else if (txStatus === "failed") newStatus = "failed"
    else if (txStatus === "abandoned") newStatus = "cancelled"
    // else leave as pending

    const adminClient = createAdminClient()
    // Update the transaction in the database if status changed
    let updateResult = null
    if (newStatus) {
      updateResult = await adminClient
        .from("transactions")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("reference", reference)
        .select()
      // Log the update result
      console.log("[VERIFY] Update result:", updateResult)
      if (updateResult.error) {
        return NextResponse.json({ error: updateResult.error.message || "Failed to update transaction status" }, { status: 500 })
      }
      if (!updateResult.data || updateResult.data.length === 0) {
        return NextResponse.json({ error: "No transaction found with the given reference" }, { status: 404 })
      }
    }

    return NextResponse.json({ success: true, status: newStatus || txStatus, paystack: paystackData.data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
} 