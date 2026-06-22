import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { v4 as uuidv4 } from "uuid"
import { createNotification } from "@/lib/actions/notifications"

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAuth()
    if (!auth?.authenticated || !auth.userId) {
      return NextResponse.json({ error: "You must be logged in to send a loan offer" }, { status: 401 })
    }

    const body = await req.json()
    const { borrowerId, amount, interestRate, duration, durationUnit } = body

    if (!borrowerId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Borrower and valid amount are required" }, { status: 400 })
    }

    const adminClient = createAdminClient() as SupabaseClient<Database>

    // Look up the lender's loan helper record for display info only
    const { data: helper } = await adminClient
      .from("loan_helpers")
      .select("name, profile_image_url")
      .eq("user_id", auth.userId)
      .maybeSingle()

    const lenderName = helper?.name || "A lender"

    const offerId = uuidv4()
    const purpose = `Loan offer from ${lenderName}`

    const { data: offer, error: offerError } = await adminClient
      .from("loan_requests")
      .insert({
        id: offerId,
        user_id: borrowerId,
        helper_id: auth.userId,
        amount,
        interest_rate: interestRate || 0,
        duration_months: duration,
        duration_unit: durationUnit || "months",
        status: "offer_pending",
        purpose,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .select("*")
      .single()

    if (offerError || !offer) {
      return NextResponse.json({ error: offerError?.message || "Failed to create loan offer" }, { status: 500 })
    }

    const offerPath = `/loan-offers/${offerId}`
    await createNotification({
      userId: borrowerId,
      actorId: auth.userId,
      type: "loan_offer",
      content: `${lenderName} sent you a loan offer. Review the terms before you decide.`,
      data: {
        loanRequestId: offerId,
        lenderId: auth.userId,
        lenderName,
        lenderImageUrl: helper?.profile_image_url || null,
        amount,
        interestRate,
        duration,
        durationUnit,
        purpose,
        targetPath: offerPath,
      },
    })

    return NextResponse.json({ success: true, offer })
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
