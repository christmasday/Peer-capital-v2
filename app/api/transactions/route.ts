import { NextResponse } from "next/server"
import { getUserTransactions } from "@/lib/actions/transactions"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServerClient()
    const result = await getUserTransactions(supabase)
    if ('success' in result && result.success === false) {
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }
    return NextResponse.json({ transactions: result.transactions || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch transactions" }, { status: 500 })
  }
} 