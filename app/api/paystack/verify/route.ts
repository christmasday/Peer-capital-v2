import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyAuth } from "@/lib/auth-middleware"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    // Check authentication first
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get the current user ID
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    // Get the reference from the query params
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Verify the payment with Paystack
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Payment provider configuration error" }, { status: 500 })
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const paystackData = await response.json()

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed",
        },
        { status: 400 },
      )
    }

    // Get the transaction from our database
    const { data: transaction, error: transactionError } = await adminClient
      .from("transactions")
      .select("*")
      .eq("reference", reference)
      .single()

    if (transactionError || !transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Verify that the transaction belongs to the current user
    if (transaction.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized access to transaction" }, { status: 403 })
    }

    // Get the user's current balance
    const { data: accountBalance, error: balanceError } = await adminClient
      .from("account_balances")
      .select("balance")
      .eq("user_id", userId)
      .single()

    if (balanceError) {
      return NextResponse.json({ error: "Could not fetch account balance" }, { status: 500 })
    }

    // Return the transaction details
    return NextResponse.json({
      success: true,
      transaction: {
        ...transaction,
        newBalance: accountBalance?.balance || 0,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
