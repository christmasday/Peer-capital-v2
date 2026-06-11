import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getDojahApiUrl, getDojahSecretKey } from "../../../../lib/dojah"

const DOJAH_SENDER_ID_CONFIG_KEY = "dojah_sender_id"

function getDojahHeaders() {
  const secretKey = getDojahSecretKey()

  return {
    "Content-Type": "application/json",
    AppId: process.env.DOJAH_APP_ID || process.env.NEXT_PUBLIC_DOJAH_APP_ID || "",
    Authorization: secretKey,
  }
}

function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/\s+/g, "").trim()
}

async function getConfiguredSenderId() {
  const admin = createAdminClient()
  const { data } = await admin
    .from("admin_config")
    .select("config_value")
    .eq("config_key", DOJAH_SENDER_ID_CONFIG_KEY)
    .maybeSingle()

  const configuredSenderId = data?.config_value?.trim()
  return configuredSenderId || process.env.DOJAH_SENDER_ID || process.env.NEXT_PUBLIC_DOJAH_SENDER_ID || ""
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as {
      phoneNumber?: string
      channel?: string
      senderId?: string
      priority?: boolean
      length?: number
      otp?: string
    }

    const phoneNumber = normalizePhoneNumber(String(body.phoneNumber || ""))
    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    if (!process.env.DOJAH_APP_ID || !getDojahSecretKey()) {
      return NextResponse.json({ error: "Dojah credentials are not configured" }, { status: 500 })
    }

    const senderId = (body.senderId || await getConfiguredSenderId()).trim()
    if (!senderId) {
      return NextResponse.json({ error: "Dojah sender ID is not configured" }, { status: 500 })
    }

    const response = await fetch(getDojahApiUrl("/api/v1/messaging/otp"), {
      method: "POST",
      headers: getDojahHeaders(),
      body: JSON.stringify({
        sender_id: senderId,
        destination: phoneNumber,
        channel: body.channel || "sms",
        priority: body.priority ?? false,
        length: body.length || 6,
        ...(body.otp ? { otp: body.otp } : {}),
      }),
    })

    const data = await response.json().catch(() => ({}))
    const referenceId = data?.entity?.reference_id || data?.reference_id || null

    return NextResponse.json(
      {
        success: response.ok,
        referenceId,
        destination: data?.entity?.destination || phoneNumber,
        status: data?.entity?.status || data?.message || null,
        dojahResponse: data,
      },
      { status: response.status }
    )
  } catch (error) {
    console.error("Error sending Dojah OTP:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}