import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.log("❌ GET /api/virtual-account - User error:", userError)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("🔍 GET /api/virtual-account - User ID:", user.id)

  // Use admin client to fetch from database
  const adminClient = createAdminClient()
  
  // Get the user's profile ID first (since virtual_accounts references profiles.id)
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single()

  if (profileError || !profile?.id) {
    console.log("❌ Could not find profile for auth user:", user.id, "Error:", profileError)
    return NextResponse.json({ error: "Could not determine profile ID" }, { status: 400 })
  }

  console.log("✅ Found profile ID:", profile.id, "for auth user:", user.id)

  // Get the user's virtual account from the database
  const { data: virtualAccount, error } = await adminClient
    .from("virtual_accounts")
    .select("*")
    .eq("user_id", profile.id)
    .single()

  console.log("🏦 Virtual account query result:", { virtualAccount, error })

  if (error) {
    if (error.code === "PGRST116") {
      // No virtual account found
      console.log("📝 No virtual account found for user")
      return NextResponse.json({
        success: false,
        message: "No virtual account found",
        virtualAccount: null
      })
    }
    
    console.log("❌ Error fetching virtual account:", error)
    return NextResponse.json({ error: "Failed to fetch virtual account details" }, { status: 500 })
  }

  console.log("✅ Success - returning virtual account data:", virtualAccount)
  return NextResponse.json({
    success: true,
    virtualAccount: virtualAccount
  })
}
