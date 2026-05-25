import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const LENDER_INTEREST_RATE_MIN_KEY = "lender_interest_rate_min_pct"
const LENDER_INTEREST_RATE_MAX_KEY = "lender_interest_rate_max_pct"

function parseConfigValue(value: string | null | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

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

    const { data: rateConfig, error: rateConfigError } = await adminClient
      .from("admin_config")
      .select("config_key, config_value")
      .in("config_key", [LENDER_INTEREST_RATE_MIN_KEY, LENDER_INTEREST_RATE_MAX_KEY])
    
    if (error || rateConfigError) {
      return NextResponse.json({ error: error?.message || rateConfigError?.message || "Failed to load fee settings" }, { status: 500 })
    }

    const feeMap = {
      lender_fee: fees?.find(f => f.fee_type === 'lender_fee')?.percentage || 1.5,
      borrower_fee: fees?.find(f => f.fee_type === 'borrower_fee')?.percentage || 1.5
    }

    const minRate = parseConfigValue(
      rateConfig?.find((item) => item.config_key === LENDER_INTEREST_RATE_MIN_KEY)?.config_value,
      5,
    )
    const maxRate = parseConfigValue(
      rateConfig?.find((item) => item.config_key === LENDER_INTEREST_RATE_MAX_KEY)?.config_value,
      20,
    )

    return NextResponse.json({
      success: true,
      fees: feeMap,
      lender_interest_rate_limits: {
        min_pct: minRate,
        max_pct: maxRate,
      },
    })
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
  const { lender_fee, borrower_fee, lender_interest_rate_min_pct, lender_interest_rate_max_pct } = body

    if (typeof lender_fee !== 'number' || lender_fee < 0 || lender_fee > 10) {
      return NextResponse.json({ error: "Invalid lender fee" }, { status: 400 })
    }

    if (typeof borrower_fee !== 'number' || borrower_fee < 0 || borrower_fee > 10) {
      return NextResponse.json({ error: "Invalid borrower fee" }, { status: 400 })
    }

    if (
      typeof lender_interest_rate_min_pct !== "number" ||
      lender_interest_rate_min_pct < 0 ||
      lender_interest_rate_min_pct > 20
    ) {
      return NextResponse.json({ error: "Invalid lender interest rate minimum" }, { status: 400 })
    }

    if (
      typeof lender_interest_rate_max_pct !== "number" ||
      lender_interest_rate_max_pct < 0 ||
      lender_interest_rate_max_pct > 20
    ) {
      return NextResponse.json({ error: "Invalid lender interest rate maximum" }, { status: 400 })
    }

    if (lender_interest_rate_min_pct > lender_interest_rate_max_pct) {
      return NextResponse.json({ error: "Lender interest rate minimum cannot exceed maximum" }, { status: 400 })
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

    await adminClient.from("admin_config").upsert(
      [
        {
          config_key: LENDER_INTEREST_RATE_MIN_KEY,
          config_value: String(lender_interest_rate_min_pct),
          updated_at: new Date().toISOString(),
          updated_by: authResult.userId,
        },
        {
          config_key: LENDER_INTEREST_RATE_MAX_KEY,
          config_value: String(lender_interest_rate_max_pct),
          updated_at: new Date().toISOString(),
          updated_by: authResult.userId,
        },
      ],
      { onConflict: "config_key" },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
