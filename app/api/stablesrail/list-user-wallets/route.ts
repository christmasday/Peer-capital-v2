import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAuth()
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as Record<string, unknown>

    // Resolve userId: prefer payload.userId, fallback to profile.sr_user_id
    let userId = (body?.userId as string) || null
    if (!userId) {
      try {
        const admin = createAdminClient()
        const { data: profile } = await admin
          .from("profiles")
          .select("sr_user_id")
          .eq("id", auth.userId)
          .maybeSingle()
        if (profile?.sr_user_id) userId = profile.sr_user_id
      } catch {}
    }

    if (!userId) {
      return NextResponse.json({ error: "userId is required (or ensure sr_user_id exists on profile)" }, { status: 400 })
    }

    const stablesrail = createStablesrailClient()
    const result = await stablesrail.listUserWallets({ userId })
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 },
      )
    }
    console.error("Error in list-user-wallets:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


