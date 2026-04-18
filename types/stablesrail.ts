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

/** Base webhook event payload */
export interface WebhookEventBase {
  /** Event type identifier */
  eventType: string
  /** Event timestamp */
  timestamp: string
  /** Request/correlation ID */
  requestId?: string
  /** Associated user ID */
  userId?: string
}

/** OTP send completed event */
export interface UserOtpSendCompletedEvent extends WebhookEventBase {
  eventType: 'user.otp.send.completed'
  data: {
    userId: string
    otpId: string
    completedAt: string
    channel: 'sms' | 'email'
  }
}

/** Virtual account created event */
export interface VirtualAccountCreatedEvent extends WebhookEventBase {
  eventType: 'virtual.account.created'
  data: {
    userId: string
    accountNumber: string
    accountName: string
    bankName: string
    bankCode: string
    currency: StablesrailCurrency
    createdAt?: string
  }
}

/** Payment confirmed event */
export interface PaymentsConfirmedEvent extends WebhookEventBase {
  eventType: 'payments.confirmed'
  data: {
    txRef: string
    userId: string
    amount: number
    currency: StablesrailCurrency
    accountNumber: string
    confirmedAt: string
    senderName?: string
    narration?: string
  }
}

/** Wallet funding success event */
export interface WalletFundingSuccessEvent extends WebhookEventBase {
  eventType: 'wallet.funding.success'
  data: {
    userId: string
    amount: number
    tokenAddress: string
    transactionHash: string
    completedAt: string
    fundingSource: string
    walletAddress: string
    network: StablesrailNetwork
  }
}

/** Swap completed event */
export interface SwapsCompletedEvent extends WebhookEventBase {
  eventType: 'swaps.completed'
  data: {
    userId: string
    requestId: string
    sellToken: string
    buyToken: string
    amountIn: number
    amountOut: number
    swapTxHash: string
    transferTxHash?: string
    completedAt: string
    smartwalletContext?: Record<string, unknown>
    swapMetrics?: {
      executionTime: number
      slippage: number
    }
  }
}

/** Swap failed event */
export interface SwapsFailedEvent extends WebhookEventBase {
  eventType: 'swaps.failed'
  data: {
    userId: string
    requestId: string
    sellToken: string
    buyToken: string
    amountIn: number
    failedAt: string
    reason: string
    retryable: boolean
    errorCode?: string
  }
}

/** Vault return transfer confirmed event */
export interface VaultReturnTransferConfirmedEvent extends WebhookEventBase {
  eventType: 'vault.return.transfer.confirmed'
  data: {
    transferId: string
    vaultReturnId: string
    amount: number
    tokenAddress: string
    transactionHash: string
    confirmedAt: string
    blockNumber: number
    network: StablesrailNetwork
  }
}

/** Vault return payout completed event */
export interface VaultReturnPayoutCompletedEvent extends WebhookEventBase {
  eventType: 'vault.return.payout.completed'
  data: {
    payoutId: string
    vaultReturnId: string
    amount: number
    recipientAccountNumber: string
    recipientBankCode: string
    transactionReference: string
    completedAt: string
    currency: StablesrailCurrency
  }
}

/** Vault return payout failed event */
export interface VaultReturnPayoutFailedEvent extends WebhookEventBase {
  eventType: 'vault.return.payout.failed'
  data: {
    payoutId: string
    vaultReturnId: string
    amount: number
    recipientAccountNumber: string
    recipientBankCode: string
    failedAt: string
    reason: string
    retryable: boolean
    errorCode?: string
  }
}

/** Union type of all webhook events */
export type WebhookEvent =
  | UserOtpSendCompletedEvent
  | VirtualAccountCreatedEvent
  | PaymentsConfirmedEvent
  | WalletFundingSuccessEvent
  | SwapsCompletedEvent
  | SwapsFailedEvent
  | VaultReturnTransferConfirmedEvent
  | VaultReturnPayoutCompletedEvent
  | VaultReturnPayoutFailedEvent

/** All possible webhook event type strings */
export type WebhookEventType = WebhookEvent['eventType']

/** Webhook event type constants */
export const WEBHOOK_EVENT_TYPES = {
  USER_OTP_SEND_COMPLETED: 'user.otp.send.completed',
  VIRTUAL_ACCOUNT_CREATED: 'virtual.account.created',
  PAYMENTS_CONFIRMED: 'payments.confirmed',
  WALLET_FUNDING_SUCCESS: 'wallet.funding.success',
  SWAPS_COMPLETED: 'swaps.completed',
  SWAPS_FAILED: 'swaps.failed',
  VAULT_RETURN_TRANSFER_CONFIRMED: 'vault.return.transfer.confirmed',
  VAULT_RETURN_PAYOUT_COMPLETED: 'vault.return.payout.completed',
  VAULT_RETURN_PAYOUT_FAILED: 'vault.return.payout.failed',
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
