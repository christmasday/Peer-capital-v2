import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"

// Stablesrail Webhook verification per docs:
// 1. Construct signing string: timestamp + raw_body
// 2. Compute HMAC-SHA256 using webhook secret as key
// 3. Hex-encode and prefix with "sha256="
// 4. Compare with X-Traycer-Signature header using constant-time comparison
function verifyWebhookSignature(rawBody: string, signatureHeader: string | null, timestamp: string | null, secret: string): boolean {
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

// Verify required headers are present
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

// Verify User-Agent header matches expected value
function validateUserAgent(userAgent: string | null): boolean {
  return userAgent === 'cNGN-Webhook/1.0'
}

// Verify Content-Type header
function validateContentType(contentType: string | null): boolean {
  return contentType === 'application/json'
}

// Validate timestamp to prevent replay attacks (optional but recommended)
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

async function logEvent(event_type: string, payload: unknown, processed = false) {
  try {
    const admin = createAdminClient()
    await admin.from("webhook_events").insert({ event_type, payload, processed })
  } catch {
    // Swallow logging errors to avoid impacting webhook ack
  }
}

// Handler for user.otp.send.completed event
async function handleUserOtpSendCompleted(payload: any) {
  try {
    const admin = createAdminClient()
    const { phoneNumber, otpId, completedAt, metadata } = payload
    
    console.log('🟢 [WEBHOOK] User OTP Send Completed:', { phoneNumber, otpId, completedAt })
    
    // Log the OTP completion for analytics/audit purposes
    await admin.from('webhook_events').insert({
      event_type: 'user.otp.send.completed',
      payload: payload,
      processed: true,
      created_at: new Date().toISOString()
    })
    
    // TODO: Add specific business logic here, such as:
    // - Update user verification status
    // - Send confirmation notification
    // - Update analytics tracking
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling user.otp.send.completed:', error)
  }
}

// Handler for virtual.account.created event
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
    console.log('✅ [WEBHOOK] Virtual account created and saved:', { accountNumber, srUserId })
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling virtual.account.created:', error)
  }
}

// Handler for payments.confirmed event
async function handlePaymentsConfirmed(payload: any) {
  try {
    const admin = createAdminClient()
    const { txRef, reference, amount, currency, status, confirmedAt, metadata } = payload
    
    console.log('🟢 [WEBHOOK] Payment Confirmed:', { txRef, amount, currency, status })
    
    // TODO: Add specific business logic here, such as:
    // - Update transaction status in database
    // - Credit user's wallet balance
    // - Send payment confirmation notification
    // - Update analytics/reporting
    // - Trigger any post-payment workflows
    
    await admin.from('webhook_events').insert({
      event_type: 'payments.confirmed',
      payload: payload,
      processed: true,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling payments.confirmed:', error)
  }
}

// Handler for wallet.funding.completed event
async function handleWalletFundingCompleted(payload: any) {
  try {
    const admin = createAdminClient()
    const { walletAddress, amount, tokenAddress, transactionHash, completedAt, fundingSource, metadata } = payload
    
    console.log('🟢 [WEBHOOK] Wallet Funding Completed:', { walletAddress, amount, tokenAddress, transactionHash })
    
    // TODO: Add specific business logic here, such as:
    // - Update wallet balance in database
    // - Record transaction in transaction history
    // - Update user's asset holdings
    // - Send funding confirmation notification
    // - Update portfolio analytics
    
    await admin.from('webhook_events').insert({
      event_type: 'wallet.funding.completed',
      payload: payload,
      processed: true,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling wallet.funding.completed:', error)
  }
}

// Handler for swaps.completed event
async function handleSwapsCompleted(payload: any) {
  try {
    const admin = createAdminClient()
    const { walletAddress, owner, sellToken, buyToken, amountIn, amountOut, swapTxHash, transferTxHash, completedAt, smartwalletContext, swapMetrics } = payload
    
    console.log('🟢 [WEBHOOK] Swap Completed:', { walletAddress, sellToken, buyToken, amountIn, amountOut, swapTxHash })
    
    // TODO: Add specific business logic here, such as:
    // - Update user's token balances
    // - Record swap transaction in history
    // - Update portfolio analytics
    // - Send swap completion notification
    // - Update trading statistics
    // - Handle any swap-related rewards/points
    
    await admin.from('webhook_events').insert({
      event_type: 'swaps.completed',
      payload: payload,
      processed: true,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling swaps.completed:', error)
  }
}

// Handler for swaps.failed event
async function handleSwapsFailed(payload: any) {
  try {
    const admin = createAdminClient()
    const { walletAddress, owner, sellToken, buyToken, amountIn, failedAt, error, retryable, metadata } = payload
    
    console.log('🔴 [WEBHOOK] Swap Failed:', { walletAddress, sellToken, buyToken, amountIn, error: error?.message })
    
    // TODO: Add specific business logic here, such as:
    // - Log swap failure for analysis
    // - Send failure notification to user
    // - Initiate retry if retryable
    // - Update failure analytics
    // - Handle refunds if necessary
    // - Update user's swap history with failure status
    
    await admin.from('webhook_events').insert({
      event_type: 'swaps.failed',
      payload: payload,
      processed: true,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling swaps.failed:', error)
  }
}

// Handler for vault.return.transfer.confirmed event
async function handleVaultReturnTransferConfirmed(payload: any) {
  try {
    const admin = createAdminClient()
    const { transferId, vaultReturnId, amount, tokenAddress, transactionHash, confirmedAt, blockNumber, metadata } = payload
    
    console.log('🟢 [WEBHOOK] Vault Return Transfer Confirmed:', { transferId, vaultReturnId, amount, tokenAddress })
    
    // TODO: Add specific business logic here, such as:
    // - Update vault return status in database
    // - Record transfer in transaction history
    // - Update user's vault holdings
    // - Send transfer confirmation notification
    // - Update vault analytics
    
    await admin.from('webhook_events').insert({
      event_type: 'vault.return.transfer.confirmed',
      payload: payload,
      processed: true,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling vault.return.transfer.confirmed:', error)
  }
}

// Handler for vault.return.payout.completed event
async function handleVaultReturnPayoutCompleted(payload: any) {
  try {
    const admin = createAdminClient()
    const { payoutId, vaultReturnId, amount, recipientAccountNumber, recipientBankCode, transactionReference, completedAt, metadata } = payload
    
    console.log('🟢 [WEBHOOK] Vault Return Payout Completed:', { payoutId, vaultReturnId, amount, recipientAccountNumber })
    
    // TODO: Add specific business logic here, such as:
    // - Update payout status in database
    // - Record payout in transaction history
    // - Update user's account balance
    // - Send payout completion notification
    // - Update payout analytics
    // - Handle any payout-related rewards
    
    await admin.from('webhook_events').insert({
      event_type: 'vault.return.payout.completed',
      payload: payload,
      processed: true,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling vault.return.payout.completed:', error)
  }
}

// Handler for vault.return.payout.failed event
async function handleVaultReturnPayoutFailed(payload: any) {
  try {
    const admin = createAdminClient()
    const { payoutId, vaultReturnId, amount, recipientAccountNumber, recipientBankCode, failedAt, error, retryable, metadata } = payload
    
    console.log('🔴 [WEBHOOK] Vault Return Payout Failed:', { payoutId, vaultReturnId, amount, error: error?.message })
    
    // TODO: Add specific business logic here, such as:
    // - Log payout failure for analysis
    // - Send failure notification to user
    // - Initiate retry if retryable
    // - Update failure analytics
    // - Handle refunds if necessary
    // - Update payout status in database
    
    await admin.from('webhook_events').insert({
      event_type: 'vault.return.payout.failed',
      payload: payload,
      processed: true,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling vault.return.payout.failed:', error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.STABLESRAIL_WEBHOOK_SECRET || ""
    if (!secret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    // Step 1: Validate required headers are present
    const headerValidation = validateWebhookHeaders(req)
    if (!headerValidation.valid) {
      await logEvent("webhook.headers.missing", { 
        missingHeaders: headerValidation.missingHeaders,
        receivedHeaders: Object.fromEntries(req.headers)
      }, false)
      return NextResponse.json({ 
        error: `Missing required headers: ${headerValidation.missingHeaders.join(', ')}` 
      }, { status: 400 })
    }

    // Step 2: Validate User-Agent header
    const userAgent = req.headers.get('user-agent')
    if (!validateUserAgent(userAgent)) {
      await logEvent("webhook.user_agent.invalid", { 
        receivedUserAgent: userAgent,
        expectedUserAgent: 'cNGN-Webhook/1.0'
      }, false)
      return NextResponse.json({ error: "Invalid User-Agent" }, { status: 401 })
    }

    // Step 3: Validate Content-Type header
    const contentType = req.headers.get('content-type')
    if (!validateContentType(contentType)) {
      await logEvent("webhook.content_type.invalid", { 
        receivedContentType: contentType,
        expectedContentType: 'application/json'
      }, false)
      return NextResponse.json({ error: "Invalid Content-Type" }, { status: 400 })
    }

    // Step 4: Read raw body for signature verification (must be done before JSON parsing)
    const rawBody = await req.text()

    // Step 5: Extract signature and timestamp headers
    const signature = req.headers.get("x-traycer-signature")
    const timestamp = req.headers.get("x-traycer-timestamp")

    // Step 5.5: Validate timestamp to prevent replay attacks
    const timestampValidation = validateTimestamp(timestamp)
    if (!timestampValidation.valid) {
      await logEvent("webhook.timestamp.invalid", { 
        timestamp,
        reason: timestampValidation.reason,
        currentTime: Date.now()
      }, false)
      return NextResponse.json({ error: `Invalid timestamp: ${timestampValidation.reason}` }, { status: 401 })
    }

    // Step 6: Verify webhook signature using HMAC-SHA256
    const signatureValid = verifyWebhookSignature(rawBody, signature, timestamp, secret)
    if (!signatureValid) {
      await logEvent("webhook.signature.invalid", { 
        headers: Object.fromEntries(req.headers), 
        body: rawBody,
        timestamp,
        signatureReceived: signature
      }, false)
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Step 7: Parse JSON payload (only after signature verification)
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

    // Step 8: Log receipt immediately (after all validations pass)
    await logEvent(eventType, payload, false)

    // Step 9: Route events (non-blocking safety inside try/catch)
    switch (eventType) {
      case "user.otp.send.completed":
        await handleUserOtpSendCompleted(payload)
        break
      case "virtual.account.created":
        await handleVirtualAccountCreated(payload)
        break
      case "payments.confirmed":
        await handlePaymentsConfirmed(payload)
        break
      case "wallet.funding.completed":
        await handleWalletFundingCompleted(payload)
        break
      case "swaps.completed":
        await handleSwapsCompleted(payload)
        break
      case "swaps.failed":
        await handleSwapsFailed(payload)
        break
      case "vault.return.transfer.confirmed":
        await handleVaultReturnTransferConfirmed(payload)
        break
      case "vault.return.payout.completed":
        await handleVaultReturnPayoutCompleted(payload)
        break
      case "vault.return.payout.failed":
        await handleVaultReturnPayoutFailed(payload)
        break
      default:
        // Unknown event; still acknowledged
        await logEvent("webhook.unknown_event", { eventType, payload }, true, "Unknown event type received")
        break
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    await logEvent("webhook.handler.error", { error: err instanceof Error ? err.message : String(err) }, false)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


