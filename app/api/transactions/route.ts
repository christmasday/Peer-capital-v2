import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createStablesrailClient } from "@/lib/stablesrail/client"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createAdminClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const direction = searchParams.get("direction") || undefined
    const type = searchParams.get("type") || undefined
    const limit = searchParams.get("limit") || "50"
    const offset = searchParams.get("offset") || "0"

    const { data: profile } = await admin
      .from("profiles")
      .select("sr_user_id")
      .eq("id", userId)
      .maybeSingle()

    const srUserId = profile?.sr_user_id
    if (!srUserId) {
      return NextResponse.json({ transactions: [], total: 0, hasMore: false })
    }

    const stablesrail = createStablesrailClient()
    const result = await stablesrail.listTransactions({
      userId: srUserId,
      ...(status && { status }),
      ...(direction && { direction: direction as "in" | "out" }),
      ...(type && { type }),
      limit: Number(limit),
      offset: Number(offset),
    })

    return NextResponse.json(result)
  } catch (err: any) {
    console.error("Failed to fetch transactions:", err)
    return NextResponse.json(
      { error: err.message || "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}
