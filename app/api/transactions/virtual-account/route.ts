import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    let userId = searchParams.get("userId")

    // If no userId is provided, use the current user
    if (!userId) {
      const supabase = createServerClient()
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      userId = sessionData.session.user.id
    }

    const adminClient = createAdminClient()

    // First, check if the user has a virtual account
    const { data: virtualAccount, error: vaError } = await adminClient
      .from("virtual_accounts")
      .select("account_number")
      .eq("user_id", userId)
      .single()

    if (vaError) {
      if (vaError.code === "PGRST116") {
        // No virtual account found
        return NextResponse.json({ transactions: [] })
      }
      console.error("Error fetching virtual account:", vaError)
      return NextResponse.json({ error: "Failed to fetch virtual account details" }, { status: 500 })
    }

    // Get transactions related to virtual account funding
    const { data: transactions, error: txError } = await adminClient
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "deposit")
      .ilike("description", "%Virtual account%")
      .order("created_at", { ascending: false })
      .limit(10)

    if (txError) {
      console.error("Error fetching transactions:", txError)
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("Error in virtual account transactions API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
