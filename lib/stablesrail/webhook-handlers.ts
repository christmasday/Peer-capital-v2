/**
 * StablesRail Webhook Event Handlers
 * 
 * Type-safe handlers for all StablesRail webhook events.
 * Each handler processes a specific event type with full TypeScript support.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type {
  WebhookEvent,
  UserOtpSendCompletedEvent,
  VirtualAccountCreatedEvent,
  PaymentsConfirmedEvent,
  WalletFundingSuccessEvent,
  SwapsCompletedEvent,
  SwapsFailedEvent,
  VaultReturnTransferConfirmedEvent,
  VaultReturnPayoutCompletedEvent,
  VaultReturnPayoutFailedEvent,
  WebhookEventType,
} from '@/types/stablesrail'
import { WEBHOOK_EVENT_TYPES } from '@/types/stablesrail'

// ============================================================================
// Handler Result Type
// ============================================================================

export interface WebhookHandlerResult {
  success: boolean
  message?: string
  error?: string
  affectedUserId?: string
}

// ============================================================================
// Handler Type Definitions
// ============================================================================

export type WebhookHandler<T extends WebhookEvent = WebhookEvent> = (
  event: T
) => Promise<WebhookHandlerResult>

export type WebhookHandlerMap = {
  [K in WebhookEventType]: WebhookHandler<Extract<WebhookEvent, { eventType: K }>>
}

// ============================================================================
// Individual Event Handlers
// ============================================================================

/**
 * Handle user.otp.send.completed event
 * Triggered when OTP has been successfully sent to user
 */
export async function handleUserOtpSendCompleted(
  event: UserOtpSendCompletedEvent
): Promise<WebhookHandlerResult> {
  try {
    const { userId, otpId, completedAt, channel } = event.data

    console.log('🟢 [WEBHOOK] User OTP Send Completed:', { userId, otpId, completedAt, channel })

    return {
      success: true,
      message: `OTP sent successfully via ${channel}`,
      affectedUserId: userId,
    }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling user.otp.send.completed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Handle virtual.account.created event
 * Triggered when a virtual account has been provisioned for a user
 */
export async function handleVirtualAccountCreated(
  event: VirtualAccountCreatedEvent
): Promise<WebhookHandlerResult> {
  try {
    const admin = createAdminClient()
    const { userId: srUserId, accountNumber, accountName, bankCode, bankName, currency } = event.data

    console.log('🟢 [WEBHOOK] Virtual Account Created:', { srUserId, accountNumber, bankName })

    if (!accountNumber || !srUserId) {
      return {
        success: false,
        error: 'Missing required fields: accountNumber or userId',
      }
    }

    // Resolve our auth user by profiles.sr_user_id
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('sr_user_id', srUserId)
      .maybeSingle()

    if (!profile?.id) {
      console.warn('🟡 [WEBHOOK] Could not find profile for sr_user_id:', srUserId)
      return {
        success: false,
        error: `Profile not found for sr_user_id: ${srUserId}`,
      }
    }

    const record = {
      user_id: profile.id as string,
      account_number: accountNumber,
      account_name: accountName,
      bank_name: bankName || 'Stablesrail',
      bank_code: bankCode || 'STABLESRAIL',
      currency: currency || 'NGN',
      assigned: true,
      updated_at: new Date().toISOString(),
    }

    // Upsert to keep a single VA row per user
    await admin.from('virtual_accounts').upsert(record, { onConflict: 'user_id' })

    console.log('✅ [WEBHOOK] Virtual account created and saved:', { accountNumber, srUserId })

    return {
      success: true,
      message: `Virtual account ${accountNumber} created`,
      affectedUserId: profile.id,
    }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling virtual.account.created:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Handle payments.confirmed event
 * Triggered when a payment to a virtual account has been confirmed
 */
export async function handlePaymentsConfirmed(
  event: PaymentsConfirmedEvent
): Promise<WebhookHandlerResult> {
  try {
    const admin = createAdminClient()
    const { txRef, userId: srUserId, amount, currency, accountNumber, confirmedAt, senderName, narration } = event.data

    console.log('🟢 [WEBHOOK] Payment Confirmed:', { txRef, srUserId, amount, currency, accountNumber })

    // Try to match to a user via sr_user_id
    let matchedUserId: string | undefined
    
    if (srUserId) {
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('sr_user_id', srUserId)
        .maybeSingle()
      
      if (profile?.id) {
        matchedUserId = profile.id
        console.log('🟢 [WEBHOOK] Matched payment to user:', matchedUserId)
      }
    }

    // If no match by sr_user_id, try by account number
    if (!matchedUserId && accountNumber) {
      const { data: vaData } = await admin
        .from('virtual_accounts')
        .select('user_id')
        .eq('account_number', accountNumber)
        .maybeSingle()

      if (vaData?.user_id) {
        matchedUserId = vaData.user_id
        console.log('🟢 [WEBHOOK] Matched payment by account number to user:', matchedUserId)
      }
    }

    return {
      success: true,
      message: `Payment of ${amount} ${currency} confirmed (ref: ${txRef})`,
      affectedUserId: matchedUserId,
    }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling payments.confirmed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Handle wallet.funding.success event
 * Triggered when tokens have been successfully deposited to a wallet
 */
export async function handleWalletFundingSuccess(
  event: WalletFundingSuccessEvent
): Promise<WebhookHandlerResult> {
  try {
    const admin = createAdminClient()
    const { userId: srUserId, amount, tokenAddress, transactionHash, completedAt, fundingSource, walletAddress, network } = event.data

    console.log('🟢 [WEBHOOK] Wallet Funding Success:', { srUserId, amount, tokenAddress, transactionHash, walletAddress })

    // Try to match user by sr_user_id
    let matchedUserId: string | undefined

    if (srUserId) {
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('sr_user_id', srUserId)
        .maybeSingle()

      if (profile?.id) {
        matchedUserId = profile.id
        console.log('🟢 [WEBHOOK] Matched wallet funding to user:', matchedUserId)
      }
    }

    // If no match by sr_user_id, try by wallet address
    if (!matchedUserId && walletAddress) {
      const { data: walletData } = await admin
        .from('wallet_address')
        .select('user_id')
        .or(`base_address.eq.${walletAddress},ethereum_address.eq.${walletAddress}`)
        .maybeSingle()

      if (walletData?.user_id) {
        matchedUserId = walletData.user_id
        console.log('🟢 [WEBHOOK] Matched wallet funding by address to user:', matchedUserId)
      }
    }

    return {
      success: true,
      message: `Wallet funded with ${amount} tokens (tx: ${transactionHash})`,
      affectedUserId: matchedUserId,
    }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling wallet.funding.success:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Handle swaps.completed event
 * Triggered when a token swap has been successfully executed
 */
export async function handleSwapsCompleted(
  event: SwapsCompletedEvent
): Promise<WebhookHandlerResult> {
  try {
    const admin = createAdminClient()
    const { userId: srUserId, requestId, sellToken, buyToken, amountIn, amountOut, swapTxHash, completedAt, swapMetrics } = event.data

    console.log('🟢 [WEBHOOK] Swap Completed:', { srUserId, sellToken, buyToken, amountIn, amountOut, swapTxHash })

    // Try to match user by sr_user_id
    let matchedUserId: string | undefined

    if (srUserId) {
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('sr_user_id', srUserId)
        .maybeSingle()

      if (profile?.id) {
        matchedUserId = profile.id
      }
    }

    return {
      success: true,
      message: `Swapped ${amountIn} ${sellToken} for ${amountOut} ${buyToken}`,
      affectedUserId: matchedUserId,
    }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling swaps.completed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Handle swaps.failed event
 * Triggered when a token swap has failed
 */
export async function handleSwapsFailed(
  event: SwapsFailedEvent
): Promise<WebhookHandlerResult> {
  try {
    const admin = createAdminClient()
    const { userId: srUserId, requestId, sellToken, buyToken, amountIn, failedAt, reason, retryable, errorCode } = event.data

    console.log('🔴 [WEBHOOK] Swap Failed:', { srUserId, sellToken, buyToken, amountIn, reason, retryable })

    // Try to match user by sr_user_id
    let matchedUserId: string | undefined

    if (srUserId) {
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('sr_user_id', srUserId)
        .maybeSingle()

      if (profile?.id) {
        matchedUserId = profile.id
      }
    }

    return {
      success: true,
      message: `Swap failed: ${reason}${retryable ? ' (retryable)' : ''}`,
      affectedUserId: matchedUserId,
    }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling swaps.failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Handle vault.return.transfer.confirmed event
 * Triggered when a vault return transfer has been confirmed on-chain
 */
export async function handleVaultReturnTransferConfirmed(
  event: VaultReturnTransferConfirmedEvent
): Promise<WebhookHandlerResult> {
  try {
    const { transferId, vaultReturnId, amount, tokenAddress, transactionHash, confirmedAt, blockNumber, network } = event.data

    console.log('🟢 [WEBHOOK] Vault Return Transfer Confirmed:', { transferId, vaultReturnId, amount, transactionHash })

    return {
      success: true,
      message: `Vault return transfer confirmed (${amount} tokens, block ${blockNumber})`,
    }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling vault.return.transfer.confirmed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Handle vault.return.payout.completed event
 * Triggered when a vault return payout (fiat) has been completed
 */
export async function handleVaultReturnPayoutCompleted(
  event: VaultReturnPayoutCompletedEvent
): Promise<WebhookHandlerResult> {
  try {
    const { payoutId, vaultReturnId, amount, recipientAccountNumber, recipientBankCode, transactionReference, completedAt, currency } = event.data

    console.log('🟢 [WEBHOOK] Vault Return Payout Completed:', { payoutId, vaultReturnId, amount, recipientAccountNumber })

    return {
      success: true,
      message: `Vault payout of ${amount} ${currency} completed (ref: ${transactionReference})`,
    }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling vault.return.payout.completed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Handle vault.return.payout.failed event
 * Triggered when a vault return payout has failed
 */
export async function handleVaultReturnPayoutFailed(
  event: VaultReturnPayoutFailedEvent
): Promise<WebhookHandlerResult> {
  try {
    const { payoutId, vaultReturnId, amount, recipientAccountNumber, recipientBankCode, failedAt, reason, retryable, errorCode } = event.data

    console.log('🔴 [WEBHOOK] Vault Return Payout Failed:', { payoutId, vaultReturnId, amount, reason, retryable })

    return {
      success: true,
      message: `Vault payout failed: ${reason}${retryable ? ' (retryable)' : ''}`,
    }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling vault.return.payout.failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Handler Registry
// ============================================================================

/**
 * Map of event types to their typed handlers
 */
export const webhookHandlers: WebhookHandlerMap = {
  [WEBHOOK_EVENT_TYPES.USER_OTP_SEND_COMPLETED]: handleUserOtpSendCompleted,
  [WEBHOOK_EVENT_TYPES.VIRTUAL_ACCOUNT_CREATED]: handleVirtualAccountCreated,
  [WEBHOOK_EVENT_TYPES.PAYMENTS_CONFIRMED]: handlePaymentsConfirmed,
  [WEBHOOK_EVENT_TYPES.WALLET_FUNDING_SUCCESS]: handleWalletFundingSuccess,
  [WEBHOOK_EVENT_TYPES.SWAPS_COMPLETED]: handleSwapsCompleted,
  [WEBHOOK_EVENT_TYPES.SWAPS_FAILED]: handleSwapsFailed,
  [WEBHOOK_EVENT_TYPES.VAULT_RETURN_TRANSFER_CONFIRMED]: handleVaultReturnTransferConfirmed,
  [WEBHOOK_EVENT_TYPES.VAULT_RETURN_PAYOUT_COMPLETED]: handleVaultReturnPayoutCompleted,
  [WEBHOOK_EVENT_TYPES.VAULT_RETURN_PAYOUT_FAILED]: handleVaultReturnPayoutFailed,
}

// ============================================================================
// Event Dispatcher
// ============================================================================

/**
 * Process a webhook event by dispatching to the appropriate typed handler.
 * Returns a standardized result for all event types.
 * 
 * @example
 * ```typescript
 * const event = validateRequest(webhookEventSchema, payload)
 * const result = await processWebhookEvent(event)
 * ```
 */
export async function processWebhookEvent(event: WebhookEvent): Promise<WebhookHandlerResult> {
  const handler = webhookHandlers[event.eventType]
  
  if (!handler) {
    console.warn('🟡 [WEBHOOK] No handler for event type:', event.eventType)
    return {
      success: false,
      error: `No handler registered for event type: ${event.eventType}`,
    }
  }

  // TypeScript knows handler is the correct type for this event
  return handler(event as any)
}

/**
 * Check if an event type is supported by the handler registry
 */
export function isKnownEventType(eventType: string): eventType is WebhookEventType {
  return eventType in webhookHandlers
}

/**
 * Get list of all supported event types
 */
export function getSupportedEventTypes(): WebhookEventType[] {
  return Object.keys(webhookHandlers) as WebhookEventType[]
}
