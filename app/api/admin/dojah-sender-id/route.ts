import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth, createAdminResponse } from "@/lib/admin-auth"
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

async function getStoredSenderId() {
  const admin = createAdminClient()
  const { data } = await admin
    .from("admin_config")
    .select("config_value, updated_at, updated_by")
    .eq("config_key", DOJAH_SENDER_ID_CONFIG_KEY)
    .maybeSingle()

  return data || null
}

export async function GET() {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const admin = createAdminClient()
    const [storedSenderIdResult, dojahSenderIdsResponse] = await Promise.all([
      getStoredSenderId(),
      fetch(getDojahApiUrl("/api/v1/messaging/sender_ids"), {
        method: "GET",
        headers: getDojahHeaders(),
      }),
    ])

    const dojahSenderIdsData = await dojahSenderIdsResponse.json().catch(() => ({}))

    const { data: updatedByProfile } = storedSenderIdResult?.updated_by
      ? await admin
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", storedSenderIdResult.updated_by)
          .maybeSingle()
      : { data: null }

    return NextResponse.json({
      success: true,
      currentSenderId: storedSenderIdResult?.config_value || process.env.DOJAH_SENDER_ID || process.env.NEXT_PUBLIC_DOJAH_SENDER_ID || "",
      updatedAt: storedSenderIdResult?.updated_at || null,
      updatedBy: updatedByProfile,
      senderIds: Array.isArray(dojahSenderIdsData?.entity) ? dojahSenderIdsData.entity : [],
      dojahResponse: dojahSenderIdsData,
    })
  } catch (error) {
    console.error("Error loading Dojah sender ID config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const body = await req.json().catch(() => ({})) as { senderId?: string }
    const senderId = String(body.senderId || "").trim()

    if (!senderId) {
      return NextResponse.json({ error: "Sender ID is required" }, { status: 400 })
    }

    if (senderId.length > 11) {
      return NextResponse.json({ error: "Sender ID must be 11 characters or less" }, { status: 400 })
    }

    if (!process.env.DOJAH_APP_ID || !getDojahSecretKey()) {
      return NextResponse.json({ error: "Dojah credentials are not configured" }, { status: 500 })
    }

    const dojahResponse = await fetch(getDojahApiUrl("/api/v1/messaging/sender_id"), {
      method: "POST",
      headers: getDojahHeaders(),
      body: JSON.stringify({ sender_id: senderId }),
    })

    const dojahData = await dojahResponse.json().catch(() => ({}))

    if (!dojahResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: dojahData?.message || dojahData?.error || "Failed to register sender ID with Dojah",
          dojahResponse: dojahData,
        },
        { status: dojahResponse.status }
      )
    }

    const admin = createAdminClient()
    const { error } = await admin.from("admin_config").upsert(
      {
        config_key: DOJAH_SENDER_ID_CONFIG_KEY,
        config_value: senderId,
        updated_by: authResult.userId,
      },
      { onConflict: "config_key" }
    )

    if (error) {
      return NextResponse.json({ error: "Failed to save sender ID configuration" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      senderId,
      message: dojahData?.entity?.message || "Sender ID request submitted successfully",
      dojahResponse: dojahData,
    })
  } catch (error) {
    console.error("Error registering Dojah sender ID:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}