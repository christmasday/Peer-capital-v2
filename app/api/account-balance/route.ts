import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get the user's account balance
  const { data, error } = await supabase.from("account_balances").select("*").eq("user_id", user.id).single()

  if (error) {
    console.error("Error fetching account balance:", error)
    return NextResponse.json({ error: "Failed to fetch account balance" }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user already has an account balance
  const { data: existingBalance, error: checkError } = await supabase
    .from("account_balances")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (checkError) {
    console.error("Error checking existing balance:", checkError)
    return NextResponse.json({ error: "Failed to check existing balance" }, { status: 500 })
  }

  if (existingBalance) {
    return NextResponse.json({ error: "User already has an account balance" }, { status: 400 })
  }

  // Create a new account balance
  const { data, error } = await supabase
    .from("account_balances")
    .insert([{ user_id: user.id, balance: 0, loan_balance: 0 }])
    .select()
    .single()

  if (error) {
    console.error("Error creating account balance:", error)
    return NextResponse.json({ error: "Failed to create account balance" }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Validate the request body
  const { balance, loan_balance } = body
  if (balance === undefined && loan_balance === undefined) {
    return NextResponse.json({ error: "At least one of balance or loan_balance must be provided" }, { status: 400 })
  }

  // Prepare update data
  const updateData: { balance?: number; loan_balance?: number } = {}
  if (balance !== undefined) updateData.balance = balance
  if (loan_balance !== undefined) updateData.loan_balance = loan_balance

  // Update the account balance
  const { data, error } = await supabase
    .from("account_balances")
    .update(updateData)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating account balance:", error)
    return NextResponse.json({ error: "Failed to update account balance" }, { status: 500 })
  }

  return NextResponse.json({ data })
}
