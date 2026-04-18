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

    const admin = createAdminClient()

    const [profileEmailRes, profilePhoneRes, authEmailRes, authPhoneRes] = await Promise.all([
      admin.from("profiles").select("id").eq("email", email).maybeSingle(),
      admin.from("profiles").select("id").eq("phone_number", phoneNumber).maybeSingle(),
      admin.from("auth_users").select("id").eq("email", email).maybeSingle(),
      admin.from("auth_users").select("id").eq("phone", phoneNumber).maybeSingle(),
    ])

    const emailExists = Boolean(profileEmailRes.data || authEmailRes.data)
    const phoneExists = Boolean(profilePhoneRes.data || authPhoneRes.data)

    if (emailExists || phoneExists) {
      return NextResponse.json({
        success: true,
        available: false,
        emailExists,
        phoneExists,
        message: emailExists && phoneExists
          ? "An account with this email and phone number already exists. Please sign in instead."
          : emailExists
            ? "An account with this email already exists. Please sign in instead."
            : "An account with this phone number already exists. Please sign in instead.",
      })
    }

    return NextResponse.json({ success: true, available: true, emailExists: false, phoneExists: false })
  } catch (error) {
    return NextResponse.json({ error: "Failed to check account availability" }, { status: 500 })
  }
}
