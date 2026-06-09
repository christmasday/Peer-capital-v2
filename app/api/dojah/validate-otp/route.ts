import { NextRequest, NextResponse } from "next/server"
import { getDojahApiUrl, getDojahSecretKey } from "../../../../lib/dojah"

function getDojahHeaders() {
  const secretKey = getDojahSecretKey()

  return {
    AppId: process.env.DOJAH_APP_ID || process.env.NEXT_PUBLIC_DOJAH_APP_ID || "",
    Authorization: secretKey,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as {
      code?: string
      referenceId?: string
    }

    if (!body.code || !body.referenceId) {
      return NextResponse.json({ error: "Code and referenceId are required" }, { status: 400 })
    }

    if (!process.env.DOJAH_APP_ID || !getDojahSecretKey()) {
      return NextResponse.json({ error: "Dojah credentials are not configured" }, { status: 500 })
    }

    const url = new URL(getDojahApiUrl("/api/v1/messaging/otp/validate"))
    url.searchParams.set("code", body.code)
    url.searchParams.set("reference_id", body.referenceId)

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: getDojahHeaders(),
    })

    const data = await response.json().catch(() => ({}))

    return NextResponse.json(
      {
        success: response.ok,
        dojahResponse: data,
        entity: data?.entity || null,
      },
      { status: response.status }
    )
  } catch (error) {
    console.error("Error validating Dojah OTP:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}