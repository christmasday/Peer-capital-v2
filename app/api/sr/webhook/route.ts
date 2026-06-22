import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateRequest, ValidationError, genericWebhookPayloadSchema, webhookEventSchema } from "@/lib/stablesrail/schemas"
import { processWebhookEvent, isKnownEventType } from "@/lib/stablesrail/webhook-handlers"
import type { WebhookEvent } from "@/types/stablesrail"

// ============================================================================
// Webhook Security Functions
// ============================================================================

/**
 * Verify webhook signature using HMAC-SHA256
 * Per Strails docs:
 * 1. Build signing string: `${timestamp}.${payloadString}`
 * 2. Compute HMAC-SHA256 using webhook secret as key
 * 3. Hex-encode
 * 4. Compare with X-Strails-Signature header using constant-time comparison
 */
function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  timestamp: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !timestamp) {
    return false
  }

  const signingString = `${timestamp}.${rawBody}`

  const expected = crypto
    .createHmac('sha256', secret)
    .update(signingString)
    .digest('hex')

  try {
    const expectedBuffer = Buffer.from(expected)
    const receivedBuffer = Buffer.from(signatureHeader)

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  } catch {
    return false
  }
}

/**
 * Verify required headers are present
 */
function validateWebhookHeaders(req: NextRequest): { valid: boolean; missingHeaders: string[] } {
  const requiredHeaders = [
    'x-strails-signature',
    'x-strails-timestamp',
    'x-strails-event',
    'x-webhook-id',
    'content-type',
  ]

  const missingHeaders: string[] = []

  for (const header of requiredHeaders) {
    if (!req.headers.get(header)) {
      missingHeaders.push(header)
    }
  }

  return {
    valid: missingHeaders.length === 0,
    missingHeaders,
  }
}

/**
 * Verify Content-Type header
 */
function validateContentType(contentType: string | null): boolean {
  return contentType === 'application/json'
}

/**
 * Validate timestamp to prevent replay attacks (ISO 8601 format)
 */
function validateTimestamp(timestamp: string | null): { valid: boolean; reason?: string } {
  if (!timestamp) {
    return { valid: false, reason: 'Missing timestamp' }
  }

  const timestampMs = new Date(timestamp).getTime()
  if (isNaN(timestampMs)) {
    return { valid: false, reason: 'Invalid timestamp format (expected ISO 8601)' }
  }

  const now = Date.now()
  const fiveMinutesAgo = now - (5 * 60 * 1000)
  const oneMinuteFuture = now + 60000

  if (timestampMs < fiveMinutesAgo) {
    return { valid: false, reason: 'Timestamp too old (replay attack)' }
  }

  if (timestampMs > oneMinuteFuture) {
    return { valid: false, reason: 'Timestamp too far in future' }
  }

  return { valid: true }
}

// ============================================================================
// Logging Helper
// ============================================================================

async function logEvent(
  eventType: string,
  payload: unknown,
  processed = false,
  notes?: string
): Promise<void> {
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
    console.error('🔴 [WEBHOOK] Failed to log event:', error)
  }
}

// ============================================================================
// Webhook Handler
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Step 1: Check webhook secret is configured
    const secret = process.env.STABLESRAIL_WEBHOOK_SECRET || ""
    if (!secret) {
      console.error('🔴 [WEBHOOK] Webhook secret not configured')
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    // Step 2: Validate required headers are present
    const headerValidation = validateWebhookHeaders(req)
    if (!headerValidation.valid) {
      await logEvent("webhook.headers.missing", {
        missingHeaders: headerValidation.missingHeaders,
      }, false)
      return NextResponse.json({
        error: `Missing required headers: ${headerValidation.missingHeaders.join(', ')}`,
      }, { status: 400 })
    }

    // Step 3: Validate Content-Type header
    const contentType = req.headers.get('content-type')
    if (!validateContentType(contentType)) {
      await logEvent("webhook.content_type.invalid", {
        receivedContentType: contentType,
        expectedContentType: 'application/json',
      }, false)
      return NextResponse.json({ error: "Invalid Content-Type" }, { status: 400 })
    }

    // Step 4: Read raw body for signature verification
    const rawBody = await req.text()

    // Step 5: Extract signature and timestamp headers
    const signature = req.headers.get("x-strails-signature")
    const timestamp = req.headers.get("x-strails-timestamp")
    const eventTypeHeader = req.headers.get("x-strails-event")
    const webhookId = req.headers.get("x-webhook-id")

    // Step 6: Validate timestamp to prevent replay attacks
    const timestampValidation = validateTimestamp(timestamp)
    if (!timestampValidation.valid) {
      await logEvent("webhook.timestamp.invalid", {
        timestamp,
        reason: timestampValidation.reason,
        currentTime: Date.now(),
      }, false)
      return NextResponse.json({ error: `Invalid timestamp: ${timestampValidation.reason}` }, { status: 401 })
    }

    // Step 7: Verify webhook signature using HMAC-SHA256
    const signatureValid = verifyWebhookSignature(rawBody, signature, timestamp, secret)
    if (!signatureValid) {
      await logEvent("webhook.signature.invalid", {
        timestamp,
        webhookId,
        signatureReceived: signature?.substring(0, 20) + '...',
      }, false)
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Step 8: Parse JSON payload
    let parsed: unknown
    try {
      parsed = JSON.parse(rawBody)
    } catch {
      await logEvent("webhook.payload.invalid_json", { body: rawBody.substring(0, 500) }, false)
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    // Step 9: Extract event type from body or header fallback
    const bodyEventType = (parsed as any)?.eventType || (parsed as any)?.event_type
    const eventType = bodyEventType || eventTypeHeader

    if (!eventType) {
      await logEvent("webhook.event.missing_type", parsed, false)
      return NextResponse.json({ error: "Missing eventType" }, { status: 400 })
    }

    // Step 10: Extract inner payload for typed processing
    const innerPayload = (parsed as any)?.payload || parsed

    console.log(`🟢 [WEBHOOK] Received event: ${eventType}`)

    // Step 11: Log receipt immediately — store the full parsed body (including requestId)
    await logEvent(eventType, parsed, false)

    // Step 12: Check if this is a known event type and process with typed handler
    if (isKnownEventType(eventType)) {
      try {
        const typedEvent = validateRequest(webhookEventSchema, {
          eventType,
          eventId: (parsed as any)?.eventId,
          fintechId: (parsed as any)?.fintechId,
          version: (parsed as any)?.version,
          timestamp: (parsed as any)?.timestamp || new Date().toISOString(),
          requestId: (parsed as any)?.requestId,
          userId: (parsed as any)?.userId,
          data: innerPayload,
        })

        const result = await processWebhookEvent(typedEvent as WebhookEvent)

        console.log(`✅ [WEBHOOK] Event ${eventType} processed:`, result)

        if (result.success) {
          await logEvent(eventType, { ...parsed, handlerResult: result }, true)
        }

        return NextResponse.json({ ok: true, result })
      } catch (error) {
        if (error instanceof ValidationError) {
          console.warn(`⚠️ [WEBHOOK] Event ${eventType} failed typed validation, processing as generic:`, error.fieldErrors)
          await logEvent(eventType, { ...parsed, validationErrors: error.fieldErrors }, true, 'Processed as generic due to validation failure')
          return NextResponse.json({ ok: true, warning: 'Processed as generic event' })
        }
        throw error
      }
    } else {
      console.warn(`⚠️ [WEBHOOK] Unknown event type: ${eventType}`)
      await logEvent("webhook.unknown_event", { eventType, payload: innerPayload }, true, 'Unknown event type')
      return NextResponse.json({ ok: true, warning: `Unknown event type: ${eventType}` })
    }
  } catch (err) {
    console.error('🔴 [WEBHOOK] Unhandled error:', err)
    await logEvent("webhook.handler.error", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }, false)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
