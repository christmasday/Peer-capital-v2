import { createAdminClient } from '@/lib/supabase/admin'
import type {
  WebhookEvent,
  VirtualAccountCreatedEvent,
  PaymentsConfirmedEvent,
  WalletFundingCompletedEvent,
  SwapCompletedEvent,
  SwapFailedEvent,
  FintechUserDepositReceivedEvent,
  FintechUserDepositFundingCompletedEvent,
  FintechUserDepositRefundedEvent,
  FintechAssetTransferCompletedEvent,
  FintechUserAssetTransferCompletedEvent,
  FintechOfframpCompletedEvent,
  WebhookEventType,
} from '@/types/stablesrail'
import { WEBHOOK_EVENT_TYPES } from '@/types/stablesrail'

export interface WebhookHandlerResult {
  success: boolean
  message?: string
  error?: string
  affectedUserId?: string
}

export type WebhookHandler<T extends WebhookEvent = WebhookEvent> = (
  event: T
) => Promise<WebhookHandlerResult>

export type WebhookHandlerMap = {
  [K in WebhookEventType]: WebhookHandler<Extract<WebhookEvent, { eventType: K }>>
}

// ============================================================================
// Event Handlers
// ============================================================================

async function handleVirtualAccountCreated(
  event: VirtualAccountCreatedEvent
): Promise<WebhookHandlerResult> {
  try {
    const admin = createAdminClient()
    const { vaId, accountNumber, bankName, accountName, createdAt } = event.data

    console.log('🟢 [WEBHOOK] Virtual Account Created:', { vaId, accountNumber, bankName })

    if (!accountNumber) {
      return { success: false, error: 'Missing accountNumber' }
    }

    // Try to find existing record by account_number
    const { data: vaData } = await admin
      .from('virtual_accounts')
      .select('user_id, account_number')
      .eq('account_number', accountNumber)
      .maybeSingle()

    if (vaData?.user_id) {
      // Existing record found — update it
      await admin.from('virtual_accounts').upsert({
        user_id: vaData.user_id,
        account_number: accountNumber,
        account_name: accountName,
        bank_name: bankName || 'Strails',
        assigned: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      console.log('✅ [WEBHOOK] Virtual account updated:', { accountNumber })
      return {
        success: true,
        message: `Virtual account ${accountNumber} updated`,
        affectedUserId: vaData.user_id,
      }
    }

    // No existing record — the POST /api/sr/virtual-account endpoint will
    // pick up this webhook event from webhook_events and create the record
    // when the client polls next
    console.log('🟡 [WEBHOOK] Virtual account not yet persisted — will be created on client poll')
    return {
      success: true,
      message: `Virtual account ${accountNumber} event received, will be persisted on next poll`,
    }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling virtual.account.created:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function handlePaymentsConfirmed(
  event: PaymentsConfirmedEvent
): Promise<WebhookHandlerResult> {
  try {
    const admin = createAdminClient()
    const { txRef, reference, amount, currency, metadata } = event.data

    console.log('🟢 [WEBHOOK] Payment Confirmed:', { txRef, amount, currency })

    let matchedUserId: string | undefined

    if (metadata?.vaId) {
      const { data: vaData } = await admin
        .from('virtual_accounts')
        .select('user_id')
        .eq('account_number', metadata.vaId)
        .maybeSingle()

      if (vaData?.user_id) {
        matchedUserId = vaData.user_id
        console.log('🟢 [WEBHOOK] Matched payment to user:', matchedUserId)
      }
    }

    return {
      success: true,
      message: `Payment of ${amount} ${currency} confirmed (ref: ${reference})`,
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

async function handleWalletFundingCompleted(
  event: WalletFundingCompletedEvent
): Promise<WebhookHandlerResult> {
  try {
    const { walletAddress, amount, transactionHash, completedAt } = event.data
    console.log('🟢 [WEBHOOK] Wallet Funding Completed:', { walletAddress, amount, transactionHash })
    return { success: true, message: `Wallet funded with ${amount} (tx: ${transactionHash})` }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling wallet.funding.completed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function handleSwapCompleted(
  event: SwapCompletedEvent
): Promise<WebhookHandlerResult> {
  try {
    const { walletAddress, sellToken, buyToken, amountIn, amountOut, swapTxHash } = event.data
    console.log('🟢 [WEBHOOK] Swap Completed:', { walletAddress, sellToken, buyToken, amountIn, amountOut, swapTxHash })
    return { success: true, message: `Swapped ${amountIn} ${sellToken} for ${amountOut} ${buyToken}` }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling swap.completed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function handleSwapFailed(
  event: SwapFailedEvent
): Promise<WebhookHandlerResult> {
  try {
    const { walletAddress, sellToken, buyToken, amountIn, error: swapError, retryable } = event.data
    console.log('🔴 [WEBHOOK] Swap Failed:', { walletAddress, sellToken, buyToken, amountIn, error: swapError.message, retryable })
    return { success: true, message: `Swap failed: ${swapError.message}${retryable ? ' (retryable)' : ''}` }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling swap.failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// Fintech Event Handlers (log + ack)
// ============================================================================

async function handleFintechUserDepositReceived(
  event: FintechUserDepositReceivedEvent
): Promise<WebhookHandlerResult> {
  try {
    const { depositId, deposit, depositor } = event.data
    console.log('🟢 [WEBHOOK] Fintech User Deposit Received:', { depositId, amount: deposit.amount, from: depositor.name })
    return { success: true, message: `Deposit of ${deposit.amount} received from ${depositor.name}` }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling fintech.user.deposit.received:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function handleFintechUserDepositFundingCompleted(
  event: FintechUserDepositFundingCompletedEvent
): Promise<WebhookHandlerResult> {
  try {
    const { depositId, amount, transactionHash, bvnVerified } = event.data
    console.log('🟢 [WEBHOOK] Fintech User Deposit Funding Completed:', { depositId, amount, bvnVerified, transactionHash })
    return { success: true, message: `Deposit funding completed: ${amount}${bvnVerified ? ' (BVN verified)' : ''}` }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling fintech.user.deposit.funding.completed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function handleFintechUserDepositRefunded(
  event: FintechUserDepositRefundedEvent
): Promise<WebhookHandlerResult> {
  try {
    const { depositId, amount, refundReason, refundReference } = event.data
    console.log('🟡 [WEBHOOK] Fintech User Deposit Refunded:', { depositId, amount, refundReason, refundReference })
    return { success: true, message: `Deposit refunded: ${refundReason} (ref: ${refundReference})` }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling fintech.user.deposit.refunded:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function handleFintechAssetTransferCompleted(
  event: FintechAssetTransferCompletedEvent
): Promise<WebhookHandlerResult> {
  try {
    const { smartWalletAddress, destinationAddress, amount, ticker, transactionHash } = event.data
    console.log('🟢 [WEBHOOK] Fintech Asset Transfer Completed:', { smartWalletAddress, destinationAddress, amount, ticker, transactionHash })
    return { success: true, message: `Transfer of ${amount} ${ticker} completed` }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling fintech.asset.transfer.completed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function handleFintechUserAssetTransferCompleted(
  event: FintechUserAssetTransferCompletedEvent
): Promise<WebhookHandlerResult> {
  try {
    const { smartWalletAddress, destinationAddress, amount, ticker, transactionHash } = event.data
    console.log('🟢 [WEBHOOK] Fintech User Asset Transfer Completed:', { smartWalletAddress, destinationAddress, amount, ticker, transactionHash })
    return { success: true, message: `User transfer of ${amount} ${ticker} completed` }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling fintech.user.asset.transfer.completed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function handleFintechOfframpCompleted(
  event: FintechOfframpCompletedEvent
): Promise<WebhookHandlerResult> {
  try {
    const { amount, currency, payoutDetails, completedAt } = event.data
    console.log('🟢 [WEBHOOK] Fintech Offramp Completed:', { amount, currency, payoutRef: payoutDetails.reference, completedAt })
    return { success: true, message: `Offramp of ${amount} ${currency} completed (ref: ${payoutDetails.reference})` }
  } catch (error) {
    console.error('🔴 [WEBHOOK] Error handling fintech.offramp.completed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// Handler Registry
// ============================================================================

export const webhookHandlers: WebhookHandlerMap = {
  [WEBHOOK_EVENT_TYPES.VIRTUAL_ACCOUNT_CREATED]: handleVirtualAccountCreated,
  [WEBHOOK_EVENT_TYPES.PAYMENTS_CONFIRMED]: handlePaymentsConfirmed,
  [WEBHOOK_EVENT_TYPES.WALLET_FUNDING_COMPLETED]: handleWalletFundingCompleted,
  [WEBHOOK_EVENT_TYPES.SWAP_COMPLETED]: handleSwapCompleted,
  [WEBHOOK_EVENT_TYPES.SWAP_FAILED]: handleSwapFailed,
  [WEBHOOK_EVENT_TYPES.FINTECH_VA_DEPOSIT_RECEIVED]: handleFintechUserDepositReceived,
  [WEBHOOK_EVENT_TYPES.FINTECH_USER_DEPOSIT_RECEIVED]: handleFintechUserDepositReceived,
  [WEBHOOK_EVENT_TYPES.FINTECH_USER_DEPOSIT_FUNDING_COMPLETED]: handleFintechUserDepositFundingCompleted,
  [WEBHOOK_EVENT_TYPES.FINTECH_USER_DEPOSIT_REFUNDED]: handleFintechUserDepositRefunded,
  [WEBHOOK_EVENT_TYPES.FINTECH_ASSET_TRANSFER_COMPLETED]: handleFintechAssetTransferCompleted,
  [WEBHOOK_EVENT_TYPES.FINTECH_ASSET_TRANSFER_FAILED]: handleFintechUserDepositRefunded,
  [WEBHOOK_EVENT_TYPES.FINTECH_USER_ASSET_TRANSFER_COMPLETED]: handleFintechUserAssetTransferCompleted,
  [WEBHOOK_EVENT_TYPES.FINTECH_USER_ASSET_TRANSFER_FAILED]: handleFintechUserDepositRefunded,
  [WEBHOOK_EVENT_TYPES.FINTECH_OFFRAMP_INITIATED]: handleFintechUserDepositReceived,
  [WEBHOOK_EVENT_TYPES.FINTECH_OFFRAMP_TRANSFER_COMPLETED]: handleFintechUserDepositReceived,
  [WEBHOOK_EVENT_TYPES.FINTECH_OFFRAMP_PAYOUT_INITIATED]: handleFintechUserDepositReceived,
  [WEBHOOK_EVENT_TYPES.FINTECH_OFFRAMP_COMPLETED]: handleFintechOfframpCompleted,
  [WEBHOOK_EVENT_TYPES.FINTECH_OFFRAMP_FAILED]: handleFintechUserDepositRefunded,
}

export async function processWebhookEvent(event: WebhookEvent): Promise<WebhookHandlerResult> {
  const handler = webhookHandlers[event.eventType]

  if (!handler) {
    console.warn('🟡 [WEBHOOK] No handler for event type:', event.eventType)
    return {
      success: false,
      error: `No handler registered for event type: ${event.eventType}`,
    }
  }

  return handler(event as any)
}

export function isKnownEventType(eventType: string): eventType is WebhookEventType {
  return eventType in webhookHandlers
}

export function getSupportedEventTypes(): WebhookEventType[] {
  return Object.keys(webhookHandlers) as WebhookEventType[]
}
