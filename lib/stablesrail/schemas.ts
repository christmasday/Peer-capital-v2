/**
 * StablesRail API Validation Schemas
 * 
 * Zod schemas for validating all StablesRail API request payloads.
 * Provides runtime type safety and detailed error messages.
 */

import { z } from 'zod'

// ============================================================================
// Custom Validation Error
// ============================================================================

export class ValidationError extends Error {
  public readonly errors: z.ZodIssue[]
  public readonly fieldErrors: Record<string, string[]>

  constructor(zodError: z.ZodError) {
    const message = zodError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    super(`Validation failed: ${message}`)
    this.name = 'ValidationError'
    this.errors = zodError.errors
    this.fieldErrors = zodError.flatten().fieldErrors as Record<string, string[]>
  }
}

// ============================================================================
// Validation Helper
// ============================================================================

/**
 * Validates data against a Zod schema and returns typed result.
 * Throws ValidationError with detailed field errors on failure.
 * 
 * @example
 * ```typescript
 * const data = validateRequest(onboardUserSchema, requestBody)
 * // data is typed as OnboardUserRequest
 * ```
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    throw new ValidationError(result.error)
  }
  
  return result.data
}

/**
 * Safely validates data without throwing.
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    return { success: false, error: new ValidationError(result.error) }
  }
  
  return { success: true, data: result.data }
}

// ============================================================================
// Common Schemas
// ============================================================================

/** Network enum schema */
export const networkSchema = z.enum(['BASE', 'ETHEREUM', 'POLYGON', 'BSC']).default('BASE')

/** Asset enum schema */
export const assetSchema = z.enum(['CNGN', 'USDC', 'USDT', 'ETH'])

/** Currency enum schema */
export const currencySchema = z.enum(['NGN', 'USD'])

/** Ethereum address schema (0x + 40 hex chars) */
export const ethereumAddressSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')

/** StablesRail user ID schema */
export const stablesrailUserIdSchema = z.string()
  .min(1, 'User ID is required')
  .max(100, 'User ID is too long')

/** Positive amount schema */
export const positiveAmountSchema = z.number()
  .positive('Amount must be greater than 0')

/** Nigerian phone number schema (optional formatting) */
export const nigerianPhoneSchema = z.string()
  .regex(/^(\+?234|0)?[789][01]\d{8}$/, 'Invalid Nigerian phone number')

/** Bank account number schema (10 digits for Nigeria) */
export const bankAccountNumberSchema = z.string()
  .regex(/^\d{10}$/, 'Bank account number must be exactly 10 digits')

/** Bank code schema */
export const bankCodeSchema = z.string()
  .min(1, 'Bank code is required')
  .max(20, 'Bank code is too long')

// ============================================================================
// User Management & Onboarding Schemas (BVN-only flow)
// ============================================================================

/** Onboarding status enum for BVN-only flow */
export const onboardingStatusSchema = z.enum([
  'pending',         // Request received, BVN verification starting
  'verifying',       // BVN verification in progress
  'verified',        // BVN verified, wallet creation starting
  'creating_wallet', // Wallet creation in progress
  'completed',       // Fully onboarded with wallet
  'failed'           // BVN verification or wallet creation failed
])

export type OnboardingStatusInput = z.infer<typeof onboardingStatusSchema>

/** Schema for user onboarding (BVN verification) */
export const onboardUserSchema = z.object({
  /** Bank Verification Number - exactly 11 digits */
  bvn: z.string()
    .regex(/^\d{11}$/, 'BVN must be exactly 11 digits')
    .describe('Bank Verification Number'),
})

export type OnboardUserInput = z.infer<typeof onboardUserSchema>

/** Schema for checking onboarding status */
export const onboardStatusSchema = z.object({
  /** Request ID from onboard user response */
  requestId: z.string()
    .min(1, 'Request ID is required')
    .describe('Request ID from onboarding'),
})

export type OnboardStatusInput = z.infer<typeof onboardStatusSchema>

/** Schema for onboard status response - poll until completed */
export const onboardStatusResponseSchema = z.object({
  requestId: z.string(),
  status: onboardingStatusSchema,
  userId: z.string().optional(),
  message: z.string(),
  walletAddress: z.string().optional(),
  wallet: z.object({
    address: z.string(),
    network: z.enum(['BASE', 'ETHEREUM', 'POLYGON', 'BSC']),
    createdAt: z.string()
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string()
  }).optional(),
  updatedAt: z.string().optional()
})

export type OnboardStatusResponseInput = z.infer<typeof onboardStatusResponseSchema>

/**
 * @deprecated OTP verification is no longer required. BVN-only flow is now used.
 * Kept for backward compatibility.
 */
export const verifyOtpSchema = z.object({
  /** Session ID (alternative to requestId) */
  sessionId: z.string().optional(),
  /** Request ID (alternative to sessionId) */
  requestId: z.string().optional(),
  /** OTP code - 6 digits (field name: code) */
  code: z.string()
    .regex(/^\d{6}$/, 'OTP code must be exactly 6 digits')
    .optional(),
  /** OTP code - 6 digits (field name: otp) */
  otp: z.string()
    .regex(/^\d{6}$/, 'OTP code must be exactly 6 digits')
    .optional(),
}).refine(
  data => data.sessionId || data.requestId,
  { message: 'Either sessionId or requestId is required', path: ['sessionId'] }
).refine(
  data => data.code || data.otp,
  { message: 'Either code or otp is required', path: ['code'] }
)

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>

/** Schema for getting user details */
export const getUserDetailsSchema = z.object({
  userId: stablesrailUserIdSchema,
})

export type GetUserDetailsInput = z.infer<typeof getUserDetailsSchema>

// ============================================================================
// Virtual Account Schemas
// ============================================================================

/** Schema for creating virtual account */
export const createVirtualAccountSchema = z.object({
  userId: stablesrailUserIdSchema,
})

export type CreateVirtualAccountInput = z.infer<typeof createVirtualAccountSchema>

/** Schema for getting virtual account */
export const getVirtualAccountSchema = z.object({
  userId: stablesrailUserIdSchema.optional(),
  accountNumber: bankAccountNumberSchema.optional(),
}).refine(
  data => data.userId || data.accountNumber,
  { message: 'Either userId or accountNumber is required', path: ['userId'] }
)

export type GetVirtualAccountInput = z.infer<typeof getVirtualAccountSchema>

/** Schema for getting virtual account by request ID */
export const getVirtualAccountByRequestIdSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
})

export type GetVirtualAccountByRequestIdInput = z.infer<typeof getVirtualAccountByRequestIdSchema>

// ============================================================================
// CNGN Ramp Schemas
// ============================================================================

/** Schema for CNGN on-ramp (fiat to crypto) */
export const cngnOnrampSchema = z.object({
  /** StablesRail user ID */
  userId: stablesrailUserIdSchema,
  /** Amount in NGN - must be positive */
  amount: positiveAmountSchema.describe('Amount in NGN to convert'),
  /** Destination wallet address (optional - can be fetched) */
  owner: ethereumAddressSchema.optional(),
  /** Target network */
  network: networkSchema.optional(),
  /** Asset to receive */
  assetSwap: assetSchema.optional().default('CNGN'),
  /** Whether to auto-swap to another asset */
  autoSwap: z.boolean().optional().default(false),
  /** Whether to sweep funds to offramp automatically */
  sweepToOfframp: z.boolean().optional().default(true),
})

export type CngnOnrampInput = z.infer<typeof cngnOnrampSchema>

/** Schema for CNGN off-ramp (crypto to fiat) */
export const cngnOfframpSchema = z.object({
  /** StablesRail user ID */
  userId: stablesrailUserIdSchema,
  /** Amount to withdraw in the specified asset - must be positive */
  amount: positiveAmountSchema.describe('Amount to withdraw in the specified asset'),
  /** Recipient bank account number */
  accountNumber: bankAccountNumberSchema,
  /** Recipient bank code */
  bankCode: bankCodeSchema,
  /** Token symbol to withdraw (e.g., "CNGN") - Required */
  ticker: assetSchema,
})

export type CngnOfframpInput = z.infer<typeof cngnOfframpSchema>

/** Schema for checking ramp status */
export const cngnRampStatusSchema = z.object({
  walletAddress: ethereumAddressSchema.optional(),
  requestId: z.string().optional(),
}).refine(
  data => data.walletAddress || data.requestId,
  { message: 'Either walletAddress or requestId is required', path: ['walletAddress'] }
)

export type CngnRampStatusInput = z.infer<typeof cngnRampStatusSchema>

// ============================================================================
// Token Withdrawal Schemas
// ============================================================================

/** Schema for token withdrawal via /withdrawasset */
export const tokenWithdrawalSchema = z.object({
  /** StablesRail user ID (hash/UUID) */
  userId: stablesrailUserIdSchema,
  /** User's internal wallet address on the platform (source wallet) */
  internalWallet: ethereumAddressSchema,
  /** External wallet or bank-linked wallet address to receive funds */
  destinationWallet: ethereumAddressSchema,
  /** Amount to withdraw - must be greater than 0 */
  amount: positiveAmountSchema.describe('Amount to withdraw'),
  /** Asset symbol to withdraw (e.g. "CNGN") */
  ticker: assetSchema,
  /** Network for the withdrawal (e.g. "bsc", "xbn", "atc", "matic", "trx") - optional */
  network: networkSchema.optional(),
})

export type TokenWithdrawalInput = z.infer<typeof tokenWithdrawalSchema>

// ============================================================================
// Wallet Operation Schemas
// ============================================================================

/** Schema for listing user wallets */
export const listUserWalletsSchema = z.object({
  userId: stablesrailUserIdSchema,
})

export type ListUserWalletsInput = z.infer<typeof listUserWalletsSchema>

// ============================================================================
// Fee Management Schemas
// ============================================================================

/** Fee configuration schema */
export const feeConfigurationSchema = z.object({
  percentageFee: z.number().min(0).max(100),
  capFee: z.number().min(0),
  enabled: z.boolean(),
})

/** Schema for managing fees */
export const manageFeesSchema = z.object({
  onrampFee: feeConfigurationSchema.optional(),
  offrampFee: feeConfigurationSchema.optional(),
  metadata: z.object({
    description: z.string().optional(),
    notes: z.string().optional(),
    lastUpdatedBy: z.string().optional(),
  }).optional(),
})

export type ManageFeesInput = z.infer<typeof manageFeesSchema>

// ============================================================================
// Webhook Payload Schemas
// ============================================================================

/** Base webhook event schema */
const webhookEventBaseSchema = z.object({
  eventType: z.string(),
  timestamp: z.string(),
  requestId: z.string().optional(),
  userId: z.string().optional(),
})

/** User OTP send completed event schema */
export const userOtpSendCompletedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('user.otp.send.completed'),
  data: z.object({
    userId: z.string(),
    otpId: z.string(),
    completedAt: z.string(),
    channel: z.enum(['sms', 'email']),
  }),
})

/** Virtual account created event schema */
export const virtualAccountCreatedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('virtual.account.created'),
  data: z.object({
    userId: z.string(),
    accountNumber: z.string(),
    accountName: z.string(),
    bankName: z.string(),
    bankCode: z.string(),
    currency: currencySchema,
    createdAt: z.string().optional(),
  }),
})

/** Payments confirmed event schema */
export const paymentsConfirmedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('payments.confirmed'),
  data: z.object({
    txRef: z.string(),
    userId: z.string(),
    amount: z.number(),
    currency: currencySchema,
    accountNumber: z.string(),
    confirmedAt: z.string(),
    senderName: z.string().optional(),
    narration: z.string().optional(),
  }),
})

/** Wallet funding success event schema */
export const walletFundingSuccessSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('wallet.funding.success'),
  data: z.object({
    userId: z.string(),
    amount: z.number(),
    tokenAddress: z.string(),
    transactionHash: z.string(),
    completedAt: z.string(),
    fundingSource: z.string(),
    walletAddress: z.string(),
    network: networkSchema,
  }),
})

/** Swaps completed event schema */
export const swapsCompletedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('swaps.completed'),
  data: z.object({
    userId: z.string(),
    requestId: z.string(),
    sellToken: z.string(),
    buyToken: z.string(),
    amountIn: z.number(),
    amountOut: z.number(),
    swapTxHash: z.string(),
    transferTxHash: z.string().optional(),
    completedAt: z.string(),
    smartwalletContext: z.record(z.unknown()).optional(),
    swapMetrics: z.object({
      executionTime: z.number(),
      slippage: z.number(),
    }).optional(),
  }),
})

/** Swaps failed event schema */
export const swapsFailedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('swaps.failed'),
  data: z.object({
    userId: z.string(),
    requestId: z.string(),
    sellToken: z.string(),
    buyToken: z.string(),
    amountIn: z.number(),
    failedAt: z.string(),
    reason: z.string(),
    retryable: z.boolean(),
    errorCode: z.string().optional(),
  }),
})

/** Vault return transfer confirmed event schema */
export const vaultReturnTransferConfirmedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('vault.return.transfer.confirmed'),
  data: z.object({
    transferId: z.string(),
    vaultReturnId: z.string(),
    amount: z.number(),
    tokenAddress: z.string(),
    transactionHash: z.string(),
    confirmedAt: z.string(),
    blockNumber: z.number(),
    network: networkSchema,
  }),
})

/** Vault return payout completed event schema */
export const vaultReturnPayoutCompletedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('vault.return.payout.completed'),
  data: z.object({
    payoutId: z.string(),
    vaultReturnId: z.string(),
    amount: z.number(),
    recipientAccountNumber: z.string(),
    recipientBankCode: z.string(),
    transactionReference: z.string(),
    completedAt: z.string(),
    currency: currencySchema,
  }),
})

/** Vault return payout failed event schema */
export const vaultReturnPayoutFailedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('vault.return.payout.failed'),
  data: z.object({
    payoutId: z.string(),
    vaultReturnId: z.string(),
    amount: z.number(),
    recipientAccountNumber: z.string(),
    recipientBankCode: z.string(),
    failedAt: z.string(),
    reason: z.string(),
    retryable: z.boolean(),
    errorCode: z.string().optional(),
  }),
})

/** Discriminated union of all webhook event schemas */
export const webhookEventSchema = z.discriminatedUnion('eventType', [
  userOtpSendCompletedSchema,
  virtualAccountCreatedSchema,
  paymentsConfirmedSchema,
  walletFundingSuccessSchema,
  swapsCompletedSchema,
  swapsFailedSchema,
  vaultReturnTransferConfirmedSchema,
  vaultReturnPayoutCompletedSchema,
  vaultReturnPayoutFailedSchema,
])

export type WebhookEventInput = z.infer<typeof webhookEventSchema>

/** Generic webhook payload schema (for unknown events) */
export const genericWebhookPayloadSchema = z.object({
  eventType: z.string(),
  timestamp: z.string().optional(),
  requestId: z.string().optional(),
  userId: z.string().optional(),
  data: z.record(z.unknown()).optional(),
}).passthrough()

export type GenericWebhookPayload = z.infer<typeof genericWebhookPayloadSchema>

// ============================================================================
// IP Allowlist Schemas
// ============================================================================

/** Schema for managing IP allowlist */
export const manageIpAllowListSchema = z.object({
  action: z.enum(['add', 'remove', 'list']),
  ipAddress: z.string()
    .ip({ message: 'Invalid IP address format' })
    .optional(),
  description: z.string().max(200).optional(),
}).refine(
  data => data.action === 'list' || data.ipAddress,
  { message: 'IP address is required for add/remove actions', path: ['ipAddress'] }
)

export type ManageIpAllowListInput = z.infer<typeof manageIpAllowListSchema>

// ============================================================================
// Webhook Configuration Schemas
// ============================================================================

/** Schema for setting webhook */
export const setWebhookSchema = z.object({
  webhookUrl: z.string().url('Invalid webhook URL'),
  enabled: z.boolean(),
})

export type SetWebhookInput = z.infer<typeof setWebhookSchema>

// ============================================================================
// Export all schemas
// ============================================================================

export const schemas = {
  // User management
  onboardUser: onboardUserSchema,
  onboardStatus: onboardStatusSchema,
  verifyOtp: verifyOtpSchema,
  getUserDetails: getUserDetailsSchema,
  
  // Virtual accounts
  createVirtualAccount: createVirtualAccountSchema,
  getVirtualAccount: getVirtualAccountSchema,
  getVirtualAccountByRequestId: getVirtualAccountByRequestIdSchema,
  
  // CNGN ramp
  cngnOnramp: cngnOnrampSchema,
  cngnOfframp: cngnOfframpSchema,
  cngnRampStatus: cngnRampStatusSchema,
  
  // Withdrawals
  tokenWithdrawal: tokenWithdrawalSchema,
  
  // Wallet operations
  listUserWallets: listUserWalletsSchema,
  
  // Fee management
  manageFees: manageFeesSchema,
  
  // Webhooks
  webhookEvent: webhookEventSchema,
  genericWebhookPayload: genericWebhookPayloadSchema,
  setWebhook: setWebhookSchema,
  
  // Configuration
  manageIpAllowList: manageIpAllowListSchema,
}
