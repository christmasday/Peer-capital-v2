import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email-service"

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 })
    }
    const html = `
      <h2>New Contact Form Submission</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Subject:</b> ${subject}</p>
      <p><b>Message:</b></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `
    const result = await sendEmail({
      to: "peercapital911@gmail.com",
      subject: `[Contact Form] ${subject}`,
      html,
    })
    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: result.error || "Failed to send email." }, { status: 500 })
    }
  } catch (err) {
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 })
  }
} 