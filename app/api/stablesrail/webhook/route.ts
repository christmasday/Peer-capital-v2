import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"

// Stablesrail Webhook verification per docs:
// signature = "sha256=" + HMAC_SHA256(secret, timestamp + raw_body)
function verifySignature(rawBody: string, signatureHeader: string | null, timestamp: string | null, secret: string): boolean {
  if (!signatureHeader || !timestamp) return false
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(timestamp + rawBody)
  const expected = `sha256=${hmac.digest("hex")}`
  // Constant-time compare
  try {
    const a = Buffer.from(expected)
    const b = Buffer.from(signatureHeader)
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

async function logEvent(event_type: string, payload: unknown, processed = false) {
  try {
    const admin = createAdminClient()
    await admin.from("webhook_events").insert({ event_type, payload, processed })
  } catch {
    // Swallow logging errors to avoid impacting webhook ack
  }
}

async function handleVirtualAccountCreated(payload: any) {
  try {
    const admin = createAdminClient()
    // Expect payload per docs
    const accountNumber = String(payload?.accountNumber || "")
    const accountName = String(payload?.accountName || "")
    const bankCode = String(payload?.bankCode || "STABLESRAIL")
    const bankName = String(payload?.bankName || "Stablesrail")
    const currency = String(payload?.currency || "NGN")
    const srUserId = String(payload?.metadata?.userId || "")

    if (!accountNumber || !srUserId) return

    // Resolve our auth user by profiles.sr_user_id
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("sr_user_id", srUserId)
      .maybeSingle()

    if (!profile?.id) return

    const record = {
      user_id: profile.id as string,
      account_number: accountNumber,
      account_name: accountName,
      bank_name: bankName,
      bank_code: bankCode,
      currency,
      assigned: true,
      updated_at: new Date().toISOString(),
    }

    // Upsert to keep a single VA row per user
    await admin.from("virtual_accounts").upsert(record, { onConflict: "user_id" })
  } catch {
    // Non-blocking
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.STABLESRAIL_WEBHOOK_SECRET || ""
    if (!secret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    // Read raw body for signature verification
    const rawBody = await req.text()

    const signature = req.headers.get("x-traycer-signature")
    const timestamp = req.headers.get("x-traycer-timestamp")

    const valid = verifySignature(rawBody, signature, timestamp, secret)
    if (!valid) {
      await logEvent("webhook.signature.invalid", { headers: Object.fromEntries(req.headers), body: rawBody }, false)
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    let parsed: any
    try {
      parsed = JSON.parse(rawBody)
    } catch {
      await logEvent("webhook.payload.invalid_json", { body: rawBody }, false)
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const eventType: string = String(parsed?.eventType || "")
    const payload = parsed?.payload

    if (!eventType) {
      await logEvent("webhook.event.missing_type", parsed, false)
      return NextResponse.json({ error: "Missing eventType" }, { status: 400 })
    }

    // Log receipt immediately
    await logEvent(eventType, payload, false)

    // Route events (non-blocking safety inside try/catch)
    switch (eventType) {
      case "virtual.account.created":
        await handleVirtualAccountCreated(payload)
        break
      case "user.otp.send.completed":
      case "payments.confirmed":
      case "wallet.funding.completed":
      case "swaps.completed":
      case "swaps.failed":
      case "vault.return.transfer.confirmed":
      case "vault.return.payout.completed":
      case "vault.return.payout.failed":
        // Logged above; extend here if/when persistence is required
        break
      default:
        // Unknown event; still acknowledged
        break
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    await logEvent("webhook.handler.error", { error: err instanceof Error ? err.message : String(err) }, false)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


