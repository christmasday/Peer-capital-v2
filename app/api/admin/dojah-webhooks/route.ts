import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth, createAdminResponse } from "@/lib/admin-auth"
import { getDojahApiUrl, getDojahSecretKey } from "../../../../lib/dojah"

const DEFAULT_SERVICES = ["sms", "kyc_widget"]

function getBaseUrl(req: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/$/, "")
}

function getCallbackUrl(req: NextRequest) {
  return `${getBaseUrl(req)}/api/dojah/webhook`
}

function getDojahHeaders() {
  const secretKey = getDojahSecretKey()

  return {
    "Content-Type": "application/json",
    AppId: process.env.DOJAH_APP_ID || "",
    Authorization: secretKey,
  }
}

function getSubscriptionServices(input: unknown) {
  if (!Array.isArray(input)) {
    return DEFAULT_SERVICES
  }

  const services = input
    .map((service) => String(service).trim())
    .filter(Boolean)

  return [...new Set(services.length > 0 ? services : DEFAULT_SERVICES)]
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const response = await fetch(getDojahApiUrl("/api/v1/webhook/fetch"), {
      method: "GET",
      headers: getDojahHeaders(),
    })

    const data = await response.json().catch(() => ({}))

    return NextResponse.json({
      success: response.ok,
      callbackUrl: getCallbackUrl(req),
      subscriptions: Array.isArray(data?.entity) ? data.entity : [],
      dojahResponse: data,
    })
  } catch (error) {
    console.error("Error in Dojah webhook GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const body = await req.json().catch(() => ({})) as {
      webhookUrl?: string
      enabled?: boolean
      services?: unknown
    }

    const enabled = body.enabled !== false
    const webhookUrl = (body.webhookUrl || getCallbackUrl(req)).trim()
    const services = getSubscriptionServices(body.services)

    if (!enabled) {
      return NextResponse.json({
        success: true,
        message: "Dojah webhook subscription skipped because webhooks are disabled",
        callbackUrl: webhookUrl,
        services,
      })
    }

    try {
      new URL(webhookUrl)
    } catch {
      return NextResponse.json({ error: "Invalid webhook URL format" }, { status: 400 })
    }

    if (!process.env.DOJAH_APP_ID || !getDojahSecretKey()) {
      return NextResponse.json({ error: "Dojah credentials are not configured" }, { status: 500 })
    }

    const results = await Promise.all(
      services.map(async (service) => {
        const response = await fetch(getDojahApiUrl("/api/v1/webhook/subscribe"), {
          method: "POST",
          headers: getDojahHeaders(),
          body: JSON.stringify({ webhook: webhookUrl, service }),
        })

        const data = await response.json().catch(() => ({}))

        return {
          service,
          ok: response.ok,
          status: response.status,
          response: data,
        }
      })
    )

    const failed = results.filter((result) => !result.ok)

    return NextResponse.json({
      success: failed.length === 0,
      callbackUrl: webhookUrl,
      services,
      results,
      message:
        failed.length === 0
          ? "Dojah webhook subscription updated successfully"
          : "One or more Dojah webhook subscriptions failed",
    }, { status: failed.length === 0 ? 200 : 207 })
  } catch (error) {
    console.error("Error in Dojah webhook POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}