import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = (body?.email || "").toString().trim().toLowerCase()
    const phoneNumber = (body?.phoneNumber || "").toString().trim()

    if (!email || !phoneNumber) {
      return NextResponse.json({ error: "Email and phone number are required" }, { status: 400 })
    }

    const username = (body?.username || "").toString().trim()

    const admin = createAdminClient()

    // Base checks for email/phone
    const checks: Promise<any>[] = [
      admin.from("profiles").select("id").eq("email", email).maybeSingle(),
      admin.from("profiles").select("id").eq("phone_number", phoneNumber).maybeSingle(),
      admin.from("auth_users").select("id").eq("email", email).maybeSingle(),
      admin.from("auth_users").select("id").eq("phone", phoneNumber).maybeSingle(),
    ]

    // If username provided, check username as well (case-insensitive)
    if (username) {
      checks.push(admin.from("profiles").select("id").ilike("username", username).maybeSingle())
    }

    const [profileEmailRes, profilePhoneRes, authEmailRes, authPhoneRes, profileUsernameRes] = await Promise.all(checks as any)

    const emailExists = Boolean(profileEmailRes.data || authEmailRes.data)
    const phoneExists = Boolean(profilePhoneRes.data || authPhoneRes.data)
    const usernameExists = Boolean(profileUsernameRes && profileUsernameRes.data)

    if (emailExists || phoneExists || usernameExists) {
      return NextResponse.json({
        success: true,
        available: false,
        emailExists,
        phoneExists,
        usernameExists,
        message: usernameExists
          ? "This username is already taken."
          : emailExists && phoneExists
            ? "An account with this email and phone number already exists. Please sign in instead."
            : emailExists
              ? "An account with this email already exists. Please sign in instead."
              : "An account with this phone number already exists. Please sign in instead.",
      })
    }

    return NextResponse.json({ success: true, available: true, emailExists: false, phoneExists: false, usernameExists: false })
  } catch (error) {
    return NextResponse.json({ error: "Failed to check account availability" }, { status: 500 })
  }
}
