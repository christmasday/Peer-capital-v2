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
 * Per StablesRail docs:
 * 1. Construct signing string: timestamp + raw_body
 * 2. Compute HMAC-SHA256 using webhook secret as key
 * 3. Hex-encode and prefix with "sha256="
 * 4. Compare with X-Traycer-Signature header using constant-time comparison
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

  // Step 1: Construct the signing string (timestamp + raw_body)
  const signingString = timestamp + rawBody

  // Step 2: Compute HMAC-SHA256
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signingString)
    .digest('hex')

  // Step 3: Hex-encode and prefix with "sha256="
  const expectedSignature = `sha256=${expected}`

  // Step 4: Constant-time comparison to prevent timing attacks
  try {
    const expectedBuffer = Buffer.from(expectedSignature)
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
    'x-traycer-signature',
    'x-traycer-timestamp',
    'user-agent',
    'content-type'
  ]

  const missingHeaders: string[] = []
  
  for (const header of requiredHeaders) {
    if (!req.headers.get(header)) {
      missingHeaders.push(header)
    }
  }

  return {
    valid: missingHeaders.length === 0,
    missingHeaders
  }
}

/**
 * Verify User-Agent header matches expected value
 */
function validateUserAgent(userAgent: string | null): boolean {
  return userAgent === 'cNGN-Webhook/1.0'
}

/**
 * Verify Content-Type header
 */
function validateContentType(contentType: string | null): boolean {
  return contentType === 'application/json'
}

/**
 * Validate timestamp to prevent replay attacks
 */
function validateTimestamp(timestamp: string | null): { valid: boolean; reason?: string } {
  if (!timestamp) {
    return { valid: false, reason: 'Missing timestamp' }
  }

  const timestampMs = parseInt(timestamp, 10) * 1000 // Convert to milliseconds
  const now = Date.now()
  const fiveMinutesAgo = now - (5 * 60 * 1000) // 5 minutes tolerance

  if (timestampMs < fiveMinutesAgo) {
    return { valid: false, reason: 'Timestamp too old (replay attack)' }
  }

  if (timestampMs > now + 60000) { // 1 minute future tolerance
    return { valid: false, reason: 'Timestamp too far in future' }
  }

  return { valid: true }
}

// ============================================================================
// Logging Helper
// ============================================================================

/**
 * Log webhook event to database
 */
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
      created_at: new Date().toISOString()
    })
  } catch (error) {
    // Swallow logging errors to avoid impacting webhook ack
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
        error: `Missing required headers: ${headerValidation.missingHeaders.join(', ')}` 
      }, { status: 400 })
    }

    // Step 3: Validate User-Agent header
    const userAgent = req.headers.get('user-agent')
    if (!validateUserAgent(userAgent)) {
      await logEvent("webhook.user_agent.invalid", { 
        receivedUserAgent: userAgent,
        expectedUserAgent: 'cNGN-Webhook/1.0'
      }, false)
      return NextResponse.json({ error: "Invalid User-Agent" }, { status: 401 })
    }

    // Step 4: Validate Content-Type header
    const contentType = req.headers.get('content-type')
    if (!validateContentType(contentType)) {
      await logEvent("webhook.content_type.invalid", { 
        receivedContentType: contentType,
        expectedContentType: 'application/json'
      }, false)
      return NextResponse.json({ error: "Invalid Content-Type" }, { status: 400 })
    }

    // Step 5: Read raw body for signature verification (must be done before JSON parsing)
    const rawBody = await req.text()

    // Step 6: Extract signature and timestamp headers
    const signature = req.headers.get("x-traycer-signature")
    const timestamp = req.headers.get("x-traycer-timestamp")

    // Step 7: Validate timestamp to prevent replay attacks
    const timestampValidation = validateTimestamp(timestamp)
    if (!timestampValidation.valid) {
      await logEvent("webhook.timestamp.invalid", { 
        timestamp,
        reason: timestampValidation.reason,
        currentTime: Date.now()
      }, false)
      return NextResponse.json({ error: `Invalid timestamp: ${timestampValidation.reason}` }, { status: 401 })
    }

    // Step 8: Verify webhook signature using HMAC-SHA256
    const signatureValid = verifyWebhookSignature(rawBody, signature, timestamp, secret)
    if (!signatureValid) {
      await logEvent("webhook.signature.invalid", { 
        timestamp,
        signatureReceived: signature?.substring(0, 20) + '...',
      }, false)
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Step 9: Parse JSON payload (only after signature verification)
    let parsed: unknown
    try {
      parsed = JSON.parse(rawBody)
    } catch {
      await logEvent("webhook.payload.invalid_json", { body: rawBody.substring(0, 500) }, false)
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    // Step 10: Validate basic webhook structure
    let genericPayload
    try {
      genericPayload = validateRequest(genericWebhookPayloadSchema, parsed)
    } catch (error) {
      if (error instanceof ValidationError) {
        await logEvent("webhook.payload.validation_failed", { 
          errors: error.fieldErrors,
          payload: parsed 
        }, false)
        return NextResponse.json({ 
          error: "Invalid webhook payload structure",
          details: error.fieldErrors 
        }, { status: 400 })
      }
      throw error
    }

    const { eventType } = genericPayload
    const payload = genericPayload.data || genericPayload

    if (!eventType) {
      await logEvent("webhook.event.missing_type", parsed, false)
      return NextResponse.json({ error: "Missing eventType" }, { status: 400 })
    }

    console.log(`🟢 [WEBHOOK] Received event: ${eventType}`)

    // Step 11: Log receipt immediately (after all validations pass)
    await logEvent(eventType, payload, false)

    // Step 12: Check if this is a known event type and process with typed handler
    if (isKnownEventType(eventType)) {
      try {
        // Validate against the full typed schema
        const typedEvent = validateRequest(webhookEventSchema, {
          eventType,
          timestamp: genericPayload.timestamp || new Date().toISOString(),
          requestId: genericPayload.requestId,
          userId: genericPayload.userId,
          data: payload,
        })

        // Process with typed handler
        const result = await processWebhookEvent(typedEvent as WebhookEvent)
        
        console.log(`✅ [WEBHOOK] Event ${eventType} processed:`, result)
        
        // Update the logged event as processed
        if (result.success) {
          await logEvent(eventType, { ...payload, handlerResult: result }, true)
        }

        return NextResponse.json({ ok: true, result })
      } catch (error) {
        // If typed validation fails, fall back to generic processing
        if (error instanceof ValidationError) {
          console.warn(`⚠️ [WEBHOOK] Event ${eventType} failed typed validation, processing as generic:`, error.fieldErrors)
          // Still acknowledge the webhook to prevent retries
          await logEvent(eventType, { payload, validationErrors: error.fieldErrors }, true, 'Processed as generic due to validation failure')
          return NextResponse.json({ ok: true, warning: 'Processed as generic event' })
        }
        throw error
      }
    } else {
      // Unknown event type - log and acknowledge
      console.warn(`⚠️ [WEBHOOK] Unknown event type: ${eventType}`)
      await logEvent("webhook.unknown_event", { eventType, payload }, true, 'Unknown event type')
      return NextResponse.json({ ok: true, warning: `Unknown event type: ${eventType}` })
    }
  } catch (err) {
    console.error('🔴 [WEBHOOK] Unhandled error:', err)
    await logEvent("webhook.handler.error", { 
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    }, false)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}