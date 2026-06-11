import { NextRequest, NextResponse } from "next/server"
import { getDojahApiUrl, getDojahSecretKey } from "../../../../lib/dojah"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      documentUrl?: string
      inputType?: "url" | "base64"
    }

    const documentUrl = String(body.documentUrl || "").trim()
    if (!documentUrl) {
      return NextResponse.json({ error: "Document URL is required" }, { status: 400 })
    }

    const appId = process.env.DOJAH_APP_ID || process.env.NEXT_PUBLIC_DOJAH_APP_ID || ""
    const secretKey = getDojahSecretKey()

    if (!appId || !secretKey) {
      return NextResponse.json({ error: "Dojah credentials are not configured" }, { status: 500 })
    }

    const response = await fetch(getDojahApiUrl("/api/v1/document/analysis"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        AppId: appId,
        Authorization: secretKey,
      },
      body: JSON.stringify({
        input_type: body.inputType || "url",
        imagefrontside: documentUrl,
      }),
    })

    const data = await response.json().catch(() => ({}))
    const overallStatus = Number(data?.entity?.status?.overall_status ?? 0)
    const reason = data?.entity?.status?.reason || data?.message || null

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: reason || "Document analysis failed",
          overallStatus,
          dojahResponse: data,
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      overallStatus,
      reason,
      verified: overallStatus === 1,
      dojahResponse: data,
    })
  } catch (error) {
    console.error("Error analyzing Dojah document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
