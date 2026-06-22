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
// Webhook Payload Schemas (Strails API v1.0)
// ============================================================================

/** Base webhook event schema */
const webhookEventBaseSchema = z.object({
  eventId: z.string(),
  eventType: z.string(),
  timestamp: z.string(),
  requestId: z.string().optional(),
  fintechId: z.string(),
  version: z.string(),
  userId: z.string().optional(),
})

/** Virtual account created event schema */
export const virtualAccountCreatedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('virtual.account.created'),
  data: z.object({
    vaId: z.string(),
    accountNumber: z.string(),
    bankName: z.string(),
    accountName: z.string(),
    createdAt: z.string(),
  }),
})

/** Payments confirmed event schema */
export const paymentsConfirmedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('payments.confirmed'),
  data: z.object({
    txRef: z.string(),
    reference: z.string(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    confirmedAt: z.string(),
    paymentTimestamp: z.string(),
    metadata: z.object({
      vaId: z.string(),
      provider: z.string(),
      walletAddress: z.string(),
    }),
  }),
})

/** Wallet funding completed event schema */
export const walletFundingCompletedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('wallet.funding.completed'),
  data: z.object({
    walletAddress: z.string(),
    amount: z.string(),
    transactionHash: z.string(),
    completedAt: z.string(),
  }),
})

/** Swap completed event schema */
export const swapCompletedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('swap.completed'),
  data: z.object({
    walletAddress: z.string(),
    owner: z.string(),
    sellToken: z.string(),
    buyToken: z.string(),
    amountIn: z.string(),
    amountOut: z.string(),
    swapTxHash: z.string(),
    transferTxHash: z.string().optional(),
    completedAt: z.string(),
    smartWalletContext: z.object({
      smartWalletAddress: z.string(),
      managedWalletAddress: z.string(),
    }).optional(),
    swapMetrics: z.object({
      executionTime: z.number(),
      gasUsed: z.string(),
      slippage: z.string(),
    }).optional(),
  }),
})

/** Swap failed event schema */
export const swapFailedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('swap.failed'),
  data: z.object({
    walletAddress: z.string(),
    owner: z.string(),
    sellToken: z.string(),
    buyToken: z.string(),
    amountIn: z.string(),
    failedAt: z.string(),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
    retryable: z.boolean(),
    metadata: z.object({
      attemptNumber: z.number(),
      pool: z.string(),
    }).optional(),
  }),
})

/** Fintech virtual account deposit received event schema */
export const fintechVirtualAccountDepositReceivedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('fintech.virtual_account.deposit.received'),
  data: z.object({
    depositId: z.string(),
    virtualAccount: z.object({
      accountNumber: z.string(),
      accountName: z.string(),
    }),
    deposit: z.object({
      amount: z.number(),
      currency: z.string(),
      reference: z.string(),
    }),
    depositor: z.object({
      name: z.string(),
      accountNumber: z.string(),
      bankName: z.string(),
      bankCode: z.string(),
    }),
    metadata: z.object({
      provider: z.string(),
      receivedAt: z.string(),
    }),
  }),
})

/** Fintech user deposit received event schema */
export const fintechUserDepositReceivedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('fintech.user.deposit.received'),
  data: z.object({
    depositId: z.string(),
    virtualAccount: z.object({
      accountNumber: z.string(),
      accountName: z.string(),
    }),
    deposit: z.object({
      amount: z.number(),
      currency: z.string(),
      reference: z.string(),
    }),
    depositor: z.object({
      name: z.string(),
      accountNumber: z.string(),
      bankName: z.string(),
      bankCode: z.string(),
    }),
    metadata: z.object({
      provider: z.string(),
      receivedAt: z.string(),
    }),
  }),
})

/** Fintech user deposit funding completed event schema */
export const fintechUserDepositFundingCompletedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('fintech.user.deposit.funding.completed'),
  data: z.object({
    depositId: z.string(),
    amount: z.string(),
    currency: z.string(),
    transactionReference: z.string(),
    smartWalletAddress: z.string(),
    transactionHash: z.string(),
    depositor: z.object({
      accountNumber: z.string(),
      accountName: z.string(),
      bankCode: z.string(),
      bankName: z.string(),
    }),
    bvnVerified: z.boolean(),
    completedAt: z.string(),
  }),
})

/** Fintech user deposit refunded event schema */
export const fintechUserDepositRefundedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('fintech.user.deposit.refunded'),
  data: z.object({
    depositId: z.string(),
    amount: z.number(),
    currency: z.string(),
    transactionReference: z.string(),
    refundReference: z.string(),
    refundReason: z.string(),
    accountType: z.string(),
    depositor: z.object({
      accountNumber: z.string(),
      accountName: z.string(),
      bankCode: z.string(),
      bankName: z.string(),
    }),
    bvnVerification: z.object({
      isMatch: z.boolean(),
      confidenceScore: z.number(),
      rejectionReasons: z.array(z.string()),
    }),
    refundedAt: z.string(),
    metadata: z.record(z.unknown()),
  }),
})

/** Fintech asset transfer completed event schema */
export const fintechAssetTransferCompletedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('fintech.asset.transfer.completed'),
  data: z.object({
    smartWalletAddress: z.string(),
    destinationAddress: z.string(),
    destinationLabel: z.string().optional(),
    amount: z.string(),
    ticker: z.string(),
    tokenAddress: z.string(),
    transactionHash: z.string(),
    blockNumber: z.number(),
    gasUsed: z.string(),
    commitmentsSafeguarded: z.object({
      activeOrders: z.number(),
      activeEscrows: z.number(),
      totalCommitted: z.string(),
      remainingBalance: z.string(),
    }).optional(),
    note: z.string().optional(),
    completedAt: z.string(),
  }),
})

/** Fintech asset transfer failed event schema */
export const fintechAssetTransferFailedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('fintech.asset.transfer.failed'),
  data: z.object({
    error: z.string(),
    failedAt: z.string(),
  }),
})

/** Fintech user asset transfer completed event schema */
export const fintechUserAssetTransferCompletedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('fintech.user.asset.transfer.completed'),
  data: z.object({
    smartWalletAddress: z.string(),
    destinationAddress: z.string(),
    amount: z.string(),
    ticker: z.string(),
    tokenAddress: z.string(),
    network: z.string(),
    transactionHash: z.string(),
    blockNumber: z.string(),
    gasUsed: z.string(),
    completedAt: z.string(),
  }),
})

/** Fintech user asset transfer failed event schema */
export const fintechUserAssetTransferFailedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('fintech.user.asset.transfer.failed'),
  data: z.object({
    smartWalletAddress: z.string(),
    destinationAddress: z.string(),
    amount: z.string(),
    ticker: z.string(),
    tokenAddress: z.string(),
    network: z.string(),
    error: z.string(),
    failedAt: z.string(),
  }),
})

/** Fintech offramp initiated event schema */
export const fintechOfframpInitiatedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('fintech.offramp.initiated'),
  data: z.object({
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    bankAccount: z.object({
      accountNumber: z.string(),
      accountName: z.string(),
      bankName: z.string(),
    }),
    wallet: z.object({
      source: z.string(),
      address: z.string(),
      network: z.string(),
    }),
    metadata: z.object({
      description: z.string(),
      initiatedBy: z.string(),
    }),
  }),
})

/** Fintech offramp transfer completed event schema */
export const fintechOfframpTransferCompletedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('fintech.offramp.transfer.completed'),
  data: z.object({
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    burnDetails: z.object({
      txHash: z.string(),
      status: z.string(),
      cNgnAmount: z.number(),
      blockNumber: z.number(),
      confirmations: z.number(),
    }),
    metadata: z.object({
      gasUsed: z.string(),
      transferredAt: z.string(),
    }),
  }),
})

/** Fintech offramp payout initiated event schema */
export const fintechOfframpPayoutInitiatedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('fintech.offramp.payout.initiated'),
  data: z.object({
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    bankAccount: z.object({
      accountNumber: z.string(),
      accountName: z.string(),
      bankName: z.string(),
      bankCode: z.string(),
    }),
    payoutDetails: z.object({
      reference: z.string(),
      provider: z.string(),
      status: z.string(),
    }),
    metadata: z.object({
      payoutInitiatedAt: z.string(),
    }),
  }),
})

/** Fintech offramp completed event schema */
export const fintechOfframpCompletedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('fintech.offramp.completed'),
  data: z.object({
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    bankAccount: z.object({
      accountNumber: z.string(),
      accountName: z.string(),
      bankName: z.string(),
    }),
    wallet: z.object({
      source: z.string(),
      address: z.string(),
      network: z.string(),
    }),
    burnDetails: z.object({
      txHash: z.string(),
      status: z.string(),
      cNgnAmount: z.number(),
    }),
    payoutDetails: z.object({
      reference: z.string(),
      provider: z.string(),
      status: z.string(),
    }),
    completedAt: z.string(),
    metadata: z.object({
      processingTime: z.number(),
    }),
  }),
})

/** Fintech offramp failed event schema */
export const fintechOfframpFailedSchema = webhookEventBaseSchema.extend({
  eventType: z.literal('fintech.offramp.failed'),
  data: z.object({
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    bankAccount: z.object({
      accountNumber: z.string(),
      accountName: z.string(),
      bankName: z.string(),
    }),
    wallet: z.object({
      source: z.string(),
      address: z.string(),
      network: z.string(),
    }),
    burnDetails: z.object({
      txHash: z.string(),
      status: z.string(),
      cNgnAmount: z.number(),
    }).optional(),
    error: z.object({
      message: z.string(),
      code: z.string(),
    }),
    timestamp: z.string(),
    metadata: z.object({
      failedAt: z.string(),
      retryable: z.boolean(),
      attemptNumber: z.number(),
    }),
  }),
})

/** Discriminated union of all webhook event schemas */
export const webhookEventSchema = z.discriminatedUnion('eventType', [
  virtualAccountCreatedSchema,
  paymentsConfirmedSchema,
  walletFundingCompletedSchema,
  swapCompletedSchema,
  swapFailedSchema,
  fintechVirtualAccountDepositReceivedSchema,
  fintechUserDepositReceivedSchema,
  fintechUserDepositFundingCompletedSchema,
  fintechUserDepositRefundedSchema,
  fintechAssetTransferCompletedSchema,
  fintechAssetTransferFailedSchema,
  fintechUserAssetTransferCompletedSchema,
  fintechUserAssetTransferFailedSchema,
  fintechOfframpInitiatedSchema,
  fintechOfframpTransferCompletedSchema,
  fintechOfframpPayoutInitiatedSchema,
  fintechOfframpCompletedSchema,
  fintechOfframpFailedSchema,
])

export type WebhookEventInput = z.infer<typeof webhookEventSchema>

/** Generic webhook payload schema (for unknown events) */
export const genericWebhookPayloadSchema = z.object({
  eventId: z.string().optional(),
  eventType: z.string(),
  timestamp: z.string().optional(),
  requestId: z.string().optional(),
  fintechId: z.string().optional(),
  version: z.string().optional(),
  userId: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
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
