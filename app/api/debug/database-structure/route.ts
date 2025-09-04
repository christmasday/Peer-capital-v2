import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()

    // Check if virtual_accounts table exists and has data
    let virtualAccountsResult = null
    try {
      const { data: virtualAccounts, error: vaError } = await adminClient
        .from("virtual_accounts")
        .select("*")
        .eq("user_id", userId)
      
      virtualAccountsResult = { data: virtualAccounts, error: vaError }
    } catch (error) {
      virtualAccountsResult = { error: "Table might not exist", details: error }
    }

    // Check if account_balances table exists and has data
    let accountBalancesResult = null
    try {
      const { data: accountBalances, error: abError } = await adminClient
        .from("account_balances")
        .select("*")
        .eq("user_id", userId)
      
      accountBalancesResult = { data: accountBalances, error: abError }
    } catch (error) {
      accountBalancesResult = { error: "Table might not exist", details: error }
    }

    // Check user profile
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, email, first_name, last_name")
      .eq("id", userId)
      .single()

    return NextResponse.json({
      success: true,
      userId,
      profile: { data: profile, error: profileError },
      virtualAccounts: virtualAccountsResult,
      accountBalances: accountBalancesResult
    })

  } catch (error) {
    console.error("Error in database structure debug:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
