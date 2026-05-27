import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

function getNestedValue(payload: any, path: string[]) {
  let current = payload

  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[key]
  }

  return current
}

function toDateString(value: unknown) {
  return value ? String(value) : undefined
}

function readPath(payload: any, path: string[]) {
  let current = payload

  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined
    }

    current = current[key]
  }

  return current
}

function buildProfileUpdate(payload: any) {
  const body = payload?.data || payload || {}
  const profileUpdate: Record<string, unknown> = {}

  const bvn = readPath(body, ["government_data", "data", "bvn", "entity", "bvn"])
    || readPath(body, ["id", "data", "id_data", "document_number"])
    || payload?.value
    || getNestedValue(body, ["bvn", "entity", "bvn"])
    || body?.bvn

  const dob = readPath(body, ["user_data", "data", "dob"])
    || readPath(body, ["government_data", "data", "bvn", "entity", "date_of_birth"])
    || readPath(body, ["id", "data", "id_data", "date_of_birth"])

  const idUrl = payload?.id_url || readPath(body, ["id", "data", "id_url"])
  const idType = payload?.id_type || readPath(body, ["id", "data", "id_data", "document_type"])
  const idNumber = readPath(body, ["id", "data", "id_data", "document_number"])
  const address = readPath(body, ["government_data", "data", "nin", "entity", "residence_AddressLine1"])
    || readPath(body, ["government_data", "data", "bvn", "entity", "residential_address"])
  const city = readPath(body, ["government_data", "data", "nin", "entity", "residence_Town"])
    || readPath(body, ["government_data", "data", "bvn", "entity", "lga_of_residence"])
  const state = readPath(body, ["government_data", "data", "nin", "entity", "residence_state"])
    || readPath(body, ["government_data", "data", "bvn", "entity", "state_of_residence"])
  const country = payload?.country || readPath(body, ["countries", "data", "country"])

  if (dob) profileUpdate.date_of_birth = toDateString(dob)
  if (bvn) {
    profileUpdate.bvn = String(bvn).replace(/\D/g, "")
    profileUpdate.bvn_verified = true
    profileUpdate.bvn_verified_at = new Date().toISOString()
  }
  if (address) profileUpdate.address = String(address)
  if (city) profileUpdate.city = String(city)
  if (state) profileUpdate.state = String(state)
  if (country) profileUpdate.country = String(country)
  if (idUrl) profileUpdate.id_document_url = String(idUrl)
  if (idType) profileUpdate.id_type = String(idType)
  if (idNumber) profileUpdate.id_number = String(idNumber)

  if (Object.keys(profileUpdate).length > 0) {
    profileUpdate.id_verified = true
  }

  return profileUpdate
}

async function logWebhookEvent(eventType: string, payload: unknown, processed: boolean, notes?: string) {
  try {
    const admin = createAdminClient()
    await admin.from("webhook_events").insert({
      event_type: eventType,
      payload,
      processed,
      notes,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Failed to log Dojah webhook event:", error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      await logWebhookEvent("dojah.invalid_json", rawBody.slice(0, 500), false, "Invalid JSON payload")
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const admin = createAdminClient()
    const service = String(payload?.service || payload?.event_type || payload?.event || "unknown")
    const status = String(payload?.verification_status || payload?.status || payload?.confirmation_status || "received").toLowerCase()
    const eventType = `dojah.${service}.${status}`

    await logWebhookEvent(eventType, payload, true)

    const userId = payload?.metadata?.user_id || payload?.data?.metadata?.user_id || payload?.user_id || null
    const isKycCompletion = service === "kyc_widget" && ["completed", "success", "approved", "verified"].includes(status)

    if (userId && isKycCompletion) {
      const profileUpdate = buildProfileUpdate(payload)

      if (Object.keys(profileUpdate).length > 0) {
        const { error } = await admin
          .from("profiles")
          .update(profileUpdate)
          .eq("id", userId)

        if (error) {
          await logWebhookEvent(eventType, payload, false, `Profile update failed: ${error.message}`)
          return NextResponse.json({ success: false, error: "Webhook processed but profile update failed" }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in Dojah webhook receiver:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}