import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email-service"

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = (body?.email || "").toString().trim().toLowerCase()
    const firstName = (body?.firstName || "").toString().trim()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const code = generateVerificationCode()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    const greeting = firstName ? `Hi ${firstName},` : "Hi,"
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0f172a; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">PeerCapital</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #0f172a; margin-top: 0;">Confirm Your Email</h2>
          <p>${greeting}</p>
          <p>Use this code to confirm your email and complete signup:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; margin: 24px 0; color: #0f172a;">
            ${code}
          </div>
          <p>This code expires in 10 minutes.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      </div>
    `

    const emailResult = await sendEmail({
      to: email,
      subject: "Your Peer Capital confirmation code",
      html,
    })

    if (!emailResult.success) {
      return NextResponse.json({ error: "Failed to send confirmation code" }, { status: 500 })
    }

    const response = NextResponse.json({ success: true, message: "Confirmation code sent" })
    response.cookies.set("signup-email-code", JSON.stringify({ email, code, expiresAt }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
