import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = (body?.email || "").toString().trim().toLowerCase()
    const code = (body?.code || "").toString().trim()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
    }

    const cookieValue = req.cookies.get("signup-email-code")?.value
    if (!cookieValue) {
      return NextResponse.json({ error: "No verification session found. Please request a new code." }, { status: 400 })
    }

    let parsed: { email?: string; code?: string; expiresAt?: number } = {}
    try {
      parsed = JSON.parse(cookieValue)
    } catch {
      return NextResponse.json({ error: "Invalid verification session. Please request a new code." }, { status: 400 })
    }

    if (!parsed.email || !parsed.code || !parsed.expiresAt) {
      return NextResponse.json({ error: "Invalid verification session. Please request a new code." }, { status: 400 })
    }

    if (Date.now() > parsed.expiresAt) {
      return NextResponse.json({ error: "Code has expired. Please request a new code." }, { status: 400 })
    }

    if (parsed.email !== email) {
      return NextResponse.json({ error: "Email does not match verification session." }, { status: 400 })
    }

    if (parsed.code !== code) {
      return NextResponse.json({ error: "Invalid confirmation code." }, { status: 400 })
    }

    try {
      const admin = createAdminClient()
      await admin
        .from("auth_users")
        .update({
          email_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("email", email)
    } catch {
      // Keep verification success for code validation even if persistence fails.
    }

    const response = NextResponse.json({ success: true })

    response.cookies.set("signup-email-verified", JSON.stringify({ email, verifiedAt: Date.now() }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60,
    })

    // Clear one-time code cookie after successful verification.
    response.cookies.set("signup-email-code", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })

    return response
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
