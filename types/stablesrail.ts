/**
 * StablesRail API Type Definitions
 * 
 * Comprehensive type definitions for the StablesRail payment infrastructure API.
 * Includes request/response interfaces for all endpoints and webhook event types.
 * 
 * ONBOARDING FLOW (BVN-only verification):
 * 1. POST /onboarduser with BVN → Returns requestId
 * 2. System validates BVN via provider (synchronous)
 * 3. On success, wallet creation begins automatically (asynchronous)
 * 4. Poll GET /onboardstatus to check wallet creation status
 * 5. When status='completed', userId and wallet details are available
 */

// ============================================================================
// Common Types
// ============================================================================

export type StablesrailNetwork = 'BASE' | 'ETHEREUM' | 'POLYGON' | 'BSC'
export type StablesrailAsset = 'CNGN' | 'USDC' | 'USDT' | 'ETH'
export type StablesrailCurrency = 'NGN' | 'USD'

/** Onboarding status values for BVN-only flow */
export type OnboardingStatus = 
  | 'pending'           // Request received, BVN verification starting
  | 'verifying'         // BVN verification in progress
  | 'verified'          // BVN verified, wallet creation starting
  | 'creating_wallet'   // Wallet creation in progress
  | 'completed'         // Fully onboarded with wallet
  | 'failed'            // BVN verification or wallet creation failed

export interface StablesrailPagination {
  page: number
  pageSize: number
  totalPages: number
  totalCount: number
}

// ============================================================================
// User Management & Onboarding (BVN-only flow - no OTP required)
// ============================================================================

/** Request payload for user onboarding (BVN verification) */
export interface OnboardUserRequest {
  /** Bank Verification Number - exactly 11 digits */
  bvn: string
}

/** Response from onboard user endpoint */
export interface OnboardUserResponse {
  /** Unique request ID for tracking the onboarding process */
  requestId: string
  /** Current status of the onboarding request */
  status: OnboardingStatus
  /** Human-readable message */
  message: string
  /** Timestamp when request was created */
  createdAt?: string
}

/** Request payload for checking onboarding status */
export interface OnboardStatusRequest {
  /** Request ID from onboard user response */
  requestId: string
}

/** Response from onboard status endpoint - poll until status='completed' */
export interface OnboardStatusResponse {
  /** Request ID */
  requestId: string
  /** Current status - poll until 'completed' or 'failed' */
  status: OnboardingStatus
  /** StablesRail user ID (available when status='completed') */
  userId?: string
  /** Human-readable message */
  message: string
  /** Wallet address (available when status='completed') */
  walletAddress?: string
  /** Wallet details (available when status='completed') */
  wallet?: {
    address: string
    network: StablesrailNetwork
    createdAt: string
  }
  /** Error details if status='failed' */
  error?: {
    code: string
    message: string
  }
  /** Timestamp of last update */
  updatedAt?: string
}

/**
 * @deprecated OTP verification is no longer required. BVN-only flow is now used.
 * Kept for backward compatibility.
 */
export interface VerifyOtpRequest {
  /** Session ID or Request ID from onboarding */
  sessionId?: string
  requestId?: string
  /** 6-digit OTP code */
  code?: string
  otp?: string
}

/**
 * @deprecated OTP verification is no longer required. BVN-only flow is now used.
 * Kept for backward compatibility.
 */
export interface VerifyOtpResponse {
  /** Whether verification was successful */
  verified: boolean
  /** StablesRail user ID */
  userId: string
  /** Human-readable message */
  message: string
  /** User details if available */
  userDetails?: {
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
  }
}

/** Request payload for getting user details */
export interface GetUserDetailsRequest {
  /** StablesRail user ID */
  userId: string
}

/** Response from get user details endpoint */
export interface GetUserDetailsResponse {
  /** StablesRail user ID */
  userId: string
  /** User's first name */
  firstName: string
  /** User's last name */
  lastName: string
  /** User's email address */
  email?: string
  /** User's phone number */
  phoneNumber?: string
  /** BVN verification status */
  bvnVerified: boolean
  /** KYC level */
  kycLevel?: number
  /** Account creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt?: string
}

// ============================================================================
// Virtual Accounts
// ============================================================================

/** Request payload for creating a virtual account */
export interface CreateVirtualAccountRequest {
  /** StablesRail user ID */
  userId: string
}

/** Response from create virtual account endpoint */
export interface CreateVirtualAccountResponse {
  /** Request ID for tracking */
  requestId: string
  /** Virtual account details (may be pending) */
  virtualAccount?: VirtualAccountDetails
  /** Current status */
  status: 'pending' | 'processing' | 'created' | 'failed'
  /** Human-readable message */
  message: string
}

/** Virtual account details */
export interface VirtualAccountDetails {
  /** Account number */
  accountNumber: string
  /** Bank code */
  bankCode: string
  /** Bank name */
  bankName: string
  /** Account holder name */
  accountName: string
  /** Account currency */
  currency: StablesrailCurrency
  /** Whether account is assigned/active */
  assigned: boolean
  /** Associated user ID */
  userId: string
  /** Request ID */
  requestId?: string
  /** Account creation timestamp */
  createdAt?: string
}

/** Request payload for getting virtual account */
export interface GetVirtualAccountRequest {
  /** StablesRail user ID */
  userId?: string
  /** Account number */
  accountNumber?: string
}

/** Request payload for getting virtual account by request ID */
export interface GetVirtualAccountByRequestIdRequest {
  /** Request ID from create virtual account */
  requestId: string
}

/** Response from get virtual account endpoint */
export interface GetVirtualAccountResponse extends VirtualAccountDetails {
  /** Current balance */
  balance?: number
}

// ============================================================================
// CNGN Ramp Operations (On-ramp / Off-ramp)
// ============================================================================

/** Request payload for CNGN on-ramp (fiat to crypto) */
export interface CngnOnrampRequest {
  /** StablesRail user ID */
  userId: string
  /** Amount in NGN */
  amount: number
  /** Destination wallet address */
  owner?: string
  /** Target network (defaults to BASE) */
  network?: StablesrailNetwork
  /** Asset to receive */
  assetSwap?: StablesrailAsset
  /** Whether to auto-swap to another asset */
  autoSwap?: boolean
  /** Whether to sweep funds to offramp automatically */
  sweepToOfframp?: boolean
}

/** Response from CNGN on-ramp endpoint */
export interface CngnOnrampResponse {
  /** Request ID for tracking */
  requestId: string
  /** Wallet address for deposit */
  walletAddress: string
  /** Current status */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** Human-readable message */
  message: string
  /** Fee breakdown */
  feeBreakdown?: {
    amount: number
    fee: number
    total: number
    feePercentage: number
  }
  /** API version */
  version?: string
  /** Whether auto-swap is enabled */
  autoSwapEnabled?: boolean
  /** Target asset */
  targetAsset?: string
  /** Network */
  network?: string
}

/** Request payload for CNGN off-ramp (crypto to fiat) */
export interface CngnOfframpRequest {
  /** StablesRail user ID */
  userId: string
  /** Amount to withdraw in the specified asset */
  amount: number
  /** Recipient bank account number */
  accountNumber: string
  /** Recipient bank code */
  bankCode: string
  /** Token symbol to withdraw (e.g., "CNGN") - Required */
  ticker: StablesrailAsset
}

/** Response from CNGN off-ramp endpoint */
export interface CngnOfframpResponse {
  /** Request ID for tracking */
  requestId: string
  /** Transaction reference */
  transactionRef?: string
  /** Current status */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** Human-readable message */
  message: string
  /** Estimated completion time */
  estimatedCompletionTime?: string
}

/** Request payload for checking ramp status */
export interface CngnRampStatusRequest {
  /** Wallet address to check */
  walletAddress?: string
  /** Request ID to check */
  requestId?: string
}

/** Response from ramp status endpoint */
export interface CngnRampStatusResponse {
  /** Request ID */
  requestId: string
  /** Current status */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** Transaction type */
  type: 'onramp' | 'offramp'
  /** Amount */
  amount: number
  /** Currency */
  currency: string
  /** Completion timestamp */
  completedAt?: string
  /** Transaction hash (if on-chain) */
  transactionHash?: string
  /** Human-readable message */
  message?: string
}

// ============================================================================
// Token Withdrawals & Asset Management
// ============================================================================

/** Request payload for token withdrawal via /withdrawasset */
export interface TokenWithdrawalRequest {
  /** StablesRail user ID */
  userId: string
  /** User's internal wallet address on the platform (source wallet) */
  internalWallet: string
  /** External wallet or bank-linked wallet address to receive funds */
  destinationWallet: string
  /** Amount to withdraw */
  amount: number
  /** Asset ticker (e.g. "CNGN") */
  ticker: StablesrailAsset
  /** Network (defaults to BASE) */
  network?: StablesrailNetwork
}

/** Response from token withdrawal endpoint */
export interface TokenWithdrawalResponse {
  /** Withdrawal ID */
  withdrawalId: string
  /** Source address */
  from: string
  /** Destination address */
  to: string
  /** Amount withdrawn */
  amount: string
  /** Asset ticker */
  ticker: string
  /** Network */
  network: string
  /** Initiation timestamp */
  initiatedAt: string
}

// ============================================================================
// Wallet Operations
// ============================================================================

/** Request payload for listing user wallets */
export interface ListUserWalletsRequest {
  /** StablesRail user ID */
  userId: string
}

/** Wallet details */
export interface WalletDetails {
  /** Wallet address */
  address: string
  /** Network */
  network: StablesrailNetwork
  /** Wallet type */
  type: 'smart' | 'eoa'
  /** Whether this is the primary wallet */
  isPrimary: boolean
  /** Creation timestamp */
  createdAt: string
}

/** Response from list user wallets endpoint */
export interface ListUserWalletsResponse {
  /** StablesRail user ID */
  userId: string
  /** List of wallets */
  wallets: WalletDetails[]
  /** Total wallet count */
  totalCount: number
}

// ============================================================================
// Bank Operations
// ============================================================================

/** Bank information */
export interface BankInfo {
  /** Bank name */
  name: string
  /** Bank code */
  code: string
}

/** Response from get bank codes endpoint */
export interface GetBankCodesResponse {
  /** Operation ID */
  operationId: string
  /** Request ID */
  requestId: string
  /** Country code */
  countryCode: string
  /** Total number of banks */
  totalCount: number
  /** List of banks */
  banks: BankInfo[]
}

// ============================================================================
// Fee Management
// ============================================================================

/** Fee configuration */
export interface FeeConfiguration {
  /** Percentage fee (0-100) */
  percentageFee: number
  /** Cap fee (maximum fee amount) */
  capFee: number
  /** Whether fee is enabled */
  enabled: boolean
  /** Optional metadata */
  metadata?: {
    description?: string
    notes?: string
    lastUpdatedBy?: string
  }
}

/** Request payload for managing fees */
export interface ManageFeesRequest {
  /** On-ramp fee configuration */
  onrampFee?: FeeConfiguration
  /** Off-ramp fee configuration */
  offrampFee?: FeeConfiguration
  /** Additional metadata */
  metadata?: {
    description?: string
    notes?: string
    lastUpdatedBy?: string
  }
}

/** Response from manage fees endpoint */
export interface ManageFeesResponse {
  /** Fintech ID */
  fintechId: string
  /** Operation performed */
  operation: string
  /** Updated fee configuration */
  feeConfiguration: {
    onrampFee?: FeeConfiguration
    offrampFee?: FeeConfiguration
  }
  /** Example calculation */
  exampleCalculation?: {
    amount: number
    fee: number
    total: number
  }
}

/** Response from get fees endpoint */
export interface GetFeesResponse {
  /** Fintech ID */
  fintechId: string
  /** Whether configuration exists */
  hasConfiguration: boolean
  /** Fee configuration */
  feeConfiguration: {
    onrampFee?: FeeConfiguration
    offrampFee?: FeeConfiguration
  }
  /** Example calculation */
  exampleCalculation?: {
    amount: number
    fee: number
    total: number
  }
}

// ============================================================================
// Configuration & Management
// ============================================================================

/** IP allowlist entry */
export interface IpAllowlistEntry {
  /** IP address */
  ipAddress: string
  /** Description */
  description?: string
  /** When IP was added */
  addedAt: string
}

/** Request payload for managing IP allowlist */
export interface ManageIpAllowListRequest {
  /** Action to perform */
  action: 'add' | 'remove' | 'list'
  /** IP address (required for add/remove) */
  ipAddress?: string
  /** Description for the IP */
  description?: string
}

/** Response from manage IP allowlist endpoint */
export interface ManageIpAllowListResponse {
  /** Action performed */
  action: string
  /** IP address affected */
  ipAddress?: string
  /** Total IPs in allowlist */
  totalIps: number
  /** Human-readable message */
  message: string
  /** Update timestamp */
  updatedAt: string
  /** List of IPs (when action is 'list') */
  ipList?: IpAllowlistEntry[]
}

/** Response from regenerate API key endpoint */
export interface RegenerateApiKeyResponse {
  /** New API key */
  apiKey: string
  /** Rotation timestamp */
  rotatedAt: string
}

// ============================================================================
// Webhook Configuration
// ============================================================================

/** Request payload for setting webhook */
export interface SetWebhookRequest {
  /** Webhook URL */
  webhookUrl: string
  /** Whether webhook is enabled */
  enabled: boolean
}

/** Response from set webhook endpoint */
export interface SetWebhookResponse {
  /** Webhook URL */
  webhookUrl: string
  /** Whether webhook is enabled */
  enabled: boolean
  /** Update timestamp */
  updatedAt: string
}

/** Response from get webhook endpoint */
export interface GetWebhookResponse {
  /** Webhook URL */
  webhookUrl: string
  /** Whether webhook is enabled */
  enabled: boolean
  /** Last verification timestamp */
  lastVerifiedAt: string
}

// ============================================================================
// Webhook Event Types
// ============================================================================

/** Base webhook event payload (Strairs API v1.0) */
export interface WebhookEventBase {
  eventId: string
  eventType: string
  timestamp: string
  requestId?: string
  fintechId: string
  version: string
  userId?: string
}

/** Virtual account created event */
export interface VirtualAccountCreatedEvent extends WebhookEventBase {
  eventType: 'virtual.account.created'
  data: {
    vaId: string
    accountNumber: string
    bankName: string
    accountName: string
    createdAt: string
  }
}

/** Payment confirmed event */
export interface PaymentsConfirmedEvent extends WebhookEventBase {
  eventType: 'payments.confirmed'
  data: {
    txRef: string
    reference: string
    amount: number
    currency: string
    status: string
    confirmedAt: string
    paymentTimestamp: string
    metadata: {
      vaId: string
      provider: string
      walletAddress: string
    }
  }
}

/** Wallet funding completed event */
export interface WalletFundingCompletedEvent extends WebhookEventBase {
  eventType: 'wallet.funding.completed'
  data: {
    walletAddress: string
    amount: string
    transactionHash: string
    completedAt: string
  }
}

/** Swap completed event */
export interface SwapCompletedEvent extends WebhookEventBase {
  eventType: 'swap.completed'
  data: {
    walletAddress: string
    owner: string
    sellToken: string
    buyToken: string
    amountIn: string
    amountOut: string
    swapTxHash: string
    transferTxHash?: string
    completedAt: string
    smartWalletContext?: {
      smartWalletAddress: string
      managedWalletAddress: string
    }
    swapMetrics?: {
      executionTime: number
      gasUsed: string
      slippage: string
    }
  }
}

/** Swap failed event */
export interface SwapFailedEvent extends WebhookEventBase {
  eventType: 'swap.failed'
  data: {
    walletAddress: string
    owner: string
    sellToken: string
    buyToken: string
    amountIn: string
    failedAt: string
    error: {
      code: string
      message: string
    }
    retryable: boolean
    metadata?: {
      attemptNumber: number
      pool: string
    }
  }
}

/** Fintech virtual account deposit received event */
export interface FintechVirtualAccountDepositReceivedEvent extends WebhookEventBase {
  eventType: 'fintech.virtual_account.deposit.received'
  data: {
    depositId: string
    virtualAccount: {
      accountNumber: string
      accountName: string
    }
    deposit: {
      amount: number
      currency: string
      reference: string
    }
    depositor: {
      name: string
      accountNumber: string
      bankName: string
      bankCode: string
    }
    metadata: {
      provider: string
      receivedAt: string
    }
  }
}

/** Fintech user deposit received event */
export interface FintechUserDepositReceivedEvent extends WebhookEventBase {
  eventType: 'fintech.user.deposit.received'
  data: {
    depositId: string
    virtualAccount: {
      accountNumber: string
      accountName: string
    }
    deposit: {
      amount: number
      currency: string
      reference: string
    }
    depositor: {
      name: string
      accountNumber: string
      bankName: string
      bankCode: string
    }
    metadata: {
      provider: string
      receivedAt: string
    }
  }
}

/** Fintech user deposit funding completed event */
export interface FintechUserDepositFundingCompletedEvent extends WebhookEventBase {
  eventType: 'fintech.user.deposit.funding.completed'
  data: {
    depositId: string
    amount: string
    currency: string
    transactionReference: string
    smartWalletAddress: string
    transactionHash: string
    depositor: {
      accountNumber: string
      accountName: string
      bankCode: string
      bankName: string
    }
    bvnVerified: boolean
    completedAt: string
  }
}

/** Fintech user deposit refunded event */
export interface FintechUserDepositRefundedEvent extends WebhookEventBase {
  eventType: 'fintech.user.deposit.refunded'
  data: {
    depositId: string
    amount: number
    currency: string
    transactionReference: string
    refundReference: string
    refundReason: string
    accountType: string
    depositor: {
      accountNumber: string
      accountName: string
      bankCode: string
      bankName: string
    }
    bvnVerification: {
      isMatch: boolean
      confidenceScore: number
      rejectionReasons: string[]
    }
    refundedAt: string
    metadata: Record<string, unknown>
  }
}

/** Fintech asset transfer completed event */
export interface FintechAssetTransferCompletedEvent extends WebhookEventBase {
  eventType: 'fintech.asset.transfer.completed'
  data: {
    smartWalletAddress: string
    destinationAddress: string
    destinationLabel?: string
    amount: string
    ticker: string
    tokenAddress: string
    transactionHash: string
    blockNumber: number
    gasUsed: string
    commitmentsSafeguarded?: {
      activeOrders: number
      activeEscrows: number
      totalCommitted: string
      remainingBalance: string
    }
    note?: string
    completedAt: string
  }
}

/** Fintech asset transfer failed event */
export interface FintechAssetTransferFailedEvent extends WebhookEventBase {
  eventType: 'fintech.asset.transfer.failed'
  data: {
    error: string
    failedAt: string
  }
}

/** Fintech user asset transfer completed event */
export interface FintechUserAssetTransferCompletedEvent extends WebhookEventBase {
  eventType: 'fintech.user.asset.transfer.completed'
  data: {
    smartWalletAddress: string
    destinationAddress: string
    amount: string
    ticker: string
    tokenAddress: string
    network: string
    transactionHash: string
    blockNumber: string
    gasUsed: string
    completedAt: string
  }
}

/** Fintech user asset transfer failed event */
export interface FintechUserAssetTransferFailedEvent extends WebhookEventBase {
  eventType: 'fintech.user.asset.transfer.failed'
  data: {
    smartWalletAddress: string
    destinationAddress: string
    amount: string
    ticker: string
    tokenAddress: string
    network: string
    error: string
    failedAt: string
  }
}

/** Fintech offramp initiated event */
export interface FintechOfframpInitiatedEvent extends WebhookEventBase {
  eventType: 'fintech.offramp.initiated'
  data: {
    amount: number
    currency: string
    status: string
    bankAccount: {
      accountNumber: string
      accountName: string
      bankName: string
    }
    wallet: {
      source: string
      address: string
      network: string
    }
    metadata: {
      description: string
      initiatedBy: string
    }
  }
}

/** Fintech offramp transfer completed event */
export interface FintechOfframpTransferCompletedEvent extends WebhookEventBase {
  eventType: 'fintech.offramp.transfer.completed'
  data: {
    amount: number
    currency: string
    status: string
    burnDetails: {
      txHash: string
      status: string
      cNgnAmount: number
      blockNumber: number
      confirmations: number
    }
    metadata: {
      gasUsed: string
      transferredAt: string
    }
  }
}

/** Fintech offramp payout initiated event */
export interface FintechOfframpPayoutInitiatedEvent extends WebhookEventBase {
  eventType: 'fintech.offramp.payout.initiated'
  data: {
    amount: number
    currency: string
    status: string
    bankAccount: {
      accountNumber: string
      accountName: string
      bankName: string
      bankCode: string
    }
    payoutDetails: {
      reference: string
      provider: string
      status: string
    }
    metadata: {
      payoutInitiatedAt: string
    }
  }
}

/** Fintech offramp completed event */
export interface FintechOfframpCompletedEvent extends WebhookEventBase {
  eventType: 'fintech.offramp.completed'
  data: {
    amount: number
    currency: string
    status: string
    bankAccount: {
      accountNumber: string
      accountName: string
      bankName: string
    }
    wallet: {
      source: string
      address: string
      network: string
    }
    burnDetails: {
      txHash: string
      status: string
      cNgnAmount: number
    }
    payoutDetails: {
      reference: string
      provider: string
      status: string
    }
    completedAt: string
    metadata: {
      processingTime: number
    }
  }
}

/** Fintech offramp failed event */
export interface FintechOfframpFailedEvent extends WebhookEventBase {
  eventType: 'fintech.offramp.failed'
  data: {
    amount: number
    currency: string
    status: string
    bankAccount: {
      accountNumber: string
      accountName: string
      bankName: string
    }
    wallet: {
      source: string
      address: string
      network: string
    }
    burnDetails?: {
      txHash: string
      status: string
      cNgnAmount: number
    }
    error: {
      message: string
      code: string
    }
    timestamp: string
    metadata: {
      failedAt: string
      retryable: boolean
      attemptNumber: number
    }
  }
}

/** Union type of all webhook events */
export type WebhookEvent =
  | VirtualAccountCreatedEvent
  | PaymentsConfirmedEvent
  | WalletFundingCompletedEvent
  | SwapCompletedEvent
  | SwapFailedEvent
  | FintechVirtualAccountDepositReceivedEvent
  | FintechUserDepositReceivedEvent
  | FintechUserDepositFundingCompletedEvent
  | FintechUserDepositRefundedEvent
  | FintechAssetTransferCompletedEvent
  | FintechAssetTransferFailedEvent
  | FintechUserAssetTransferCompletedEvent
  | FintechUserAssetTransferFailedEvent
  | FintechOfframpInitiatedEvent
  | FintechOfframpTransferCompletedEvent
  | FintechOfframpPayoutInitiatedEvent
  | FintechOfframpCompletedEvent
  | FintechOfframpFailedEvent

/** All possible webhook event type strings */
export type WebhookEventType = WebhookEvent['eventType']

/** Webhook event type constants */
export const WEBHOOK_EVENT_TYPES = {
  VIRTUAL_ACCOUNT_CREATED: 'virtual.account.created',
  PAYMENTS_CONFIRMED: 'payments.confirmed',
  WALLET_FUNDING_COMPLETED: 'wallet.funding.completed',
  SWAP_COMPLETED: 'swap.completed',
  SWAP_FAILED: 'swap.failed',
  FINTECH_VA_DEPOSIT_RECEIVED: 'fintech.virtual_account.deposit.received',
  FINTECH_USER_DEPOSIT_RECEIVED: 'fintech.user.deposit.received',
  FINTECH_USER_DEPOSIT_FUNDING_COMPLETED: 'fintech.user.deposit.funding.completed',
  FINTECH_USER_DEPOSIT_REFUNDED: 'fintech.user.deposit.refunded',
  FINTECH_ASSET_TRANSFER_COMPLETED: 'fintech.asset.transfer.completed',
  FINTECH_ASSET_TRANSFER_FAILED: 'fintech.asset.transfer.failed',
  FINTECH_USER_ASSET_TRANSFER_COMPLETED: 'fintech.user.asset.transfer.completed',
  FINTECH_USER_ASSET_TRANSFER_FAILED: 'fintech.user.asset.transfer.failed',
  FINTECH_OFFRAMP_INITIATED: 'fintech.offramp.initiated',
  FINTECH_OFFRAMP_TRANSFER_COMPLETED: 'fintech.offramp.transfer.completed',
  FINTECH_OFFRAMP_PAYOUT_INITIATED: 'fintech.offramp.payout.initiated',
  FINTECH_OFFRAMP_COMPLETED: 'fintech.offramp.completed',
  FINTECH_OFFRAMP_FAILED: 'fintech.offramp.failed',
} as const

// ============================================================================
// API Response Wrappers
// ============================================================================

/** Standard success response wrapper */
export interface StablesrailApiResponse<T> {
  status: 'success'
  response_code: string | number
  message: string
  data: T
}

/** Standard error response */
export interface StablesrailApiError {
  status: 'error'
  response_code: string | number
  message: string
  data?: {
    error?: string
    details?: Record<string, unknown>
  }
}

// ============================================================================
// Client Configuration
// ============================================================================

/** StablesRail client configuration */
export interface StablesrailClientConfig {
  /** API key */
  apiKey: string
  /** Base URL (defaults to https://beta.stablesrail.io/v1/) */
  baseUrl?: string
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number
  /** Retry configuration */
  retry?: RetryConfig
}

/** Retry configuration */
export interface RetryConfig {
  /** Maximum number of retries (default: 3) */
  maxRetries?: number
  /** Base delay in milliseconds (default: 1000) */
  baseDelayMs?: number
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number
  /** HTTP status codes to retry on (default: [429, 500, 502, 503, 504]) */
  retryableStatuses?: number[]
}

/** Request options for StablesRail client */
export interface StablesrailRequestOptions {
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT'
  /** Query parameters */
  query?: Record<string, string | number | boolean | undefined>
  /** Request body */
  body?: unknown
  /** Abort signal for cancellation */
  signal?: AbortSignal
  /** Idempotency key for mutation operations */
  idempotencyKey?: string
  /** Custom timeout for this request */
  timeout?: number
  /** Whether to skip retry logic */
  skipRetry?: boolean
}
