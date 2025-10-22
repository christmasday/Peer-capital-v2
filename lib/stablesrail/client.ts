// Stablesrail API Client
// Docs: https://docs.stablesrail.io/
// Base URL: https://beta.stablesrail.io/v1/

/*
  Usage:
    import { createStablesrailClient } from "@/lib/stablesrail/client"

    const stablesrail = createStablesrailClient()
    const virtualAccount = await stablesrail.getVirtualAccount({ userId: "..." })

  Env Vars:
    - STABLESRAIL_API_KEY: Your Stablesrail API key
    - STABLESRAIL_BASE_URL (optional): Override API base URL (defaults to https://beta.stablesrail.io/v1/)
*/

export type StablesrailSuccessResponse<T> = {
  status: "success"
  response_code: string | number
  message: string
  data: T
}

export type StablesrailErrorResponse = {
  status: "error"
  response_code: string | number
  message: string
  data?: {
    error?: string
    details?: Record<string, unknown>
  }
}

export class StablesrailError extends Error {
  public readonly responseCode: string | number
  public readonly details?: Record<string, unknown>

  constructor(message: string, responseCode: string | number, details?: Record<string, unknown>) {
    super(message)
    this.name = "StablesrailError"
    this.responseCode = responseCode
    this.details = details
  }
}

export type HttpMethod = "GET" | "POST" | "PUT"

export interface RequestOptions {
  method?: HttpMethod
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  signal?: AbortSignal
}

function buildQuery(params?: RequestOptions["query"]): string {
  if (!params) return ""
  const usp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    usp.set(key, String(value))
  }
  const queryString = usp.toString()
  return queryString ? `?${queryString}` : ""
}

export class StablesrailClient {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(apiKey: string, baseUrl = "https://beta.stablesrail.io/v1/") {
    if (!apiKey) {
      throw new Error("STABLESRAIL_API_KEY is required to use StablesrailClient")
    }
    this.apiKey = apiKey
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const method: HttpMethod = options.method || (options.body ? "POST" : "GET")
    const url = `${this.baseUrl}${path.replace(/^\//, "")}${buildQuery(options.query)}`

    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
    }

    let body: BodyInit | undefined
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json"
      body = JSON.stringify(options.body)
    }

    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: options.signal,
      // Force server-side fetch semantics
      cache: "no-store",
      next: { revalidate: 0 },
    })

    const json = (await res.json().catch(() => ({}))) as
      | StablesrailSuccessResponse<T>
      | StablesrailErrorResponse

    // The API uses a status field to indicate success/error
    if ((json as StablesrailErrorResponse).status === "error") {
      const err = json as StablesrailErrorResponse
      throw new StablesrailError(err.message || "Stablesrail API error", err.response_code, err.data)
    }

    const ok = json as StablesrailSuccessResponse<T>
    return ok.data
  }

  // ============ User Management & Authentication ==========
  onboardUser(payload: {
    // Exact fields depend on onboarding integration; accept generic payload
    [key: string]: unknown
  }) {
    return this.request<unknown>("onboarduser", { method: "POST", body: payload })
  }

  verifyOtp(payload: { userId?: string; otp?: string; [key: string]: unknown }) {
    return this.request<unknown>("verifyotp", { method: "POST", body: payload })
  }

  getOnboardStatus(query: { userId?: string; reference?: string }) {
    return this.request<unknown>("onboardstatus", { method: "GET", query })
  }

  getUserDetails(query: { userId: string }) {
    return this.request<unknown>("getuserdetails", { method: "GET", query })
  }

  // ============ Virtual Accounts & Wallet Operations ==========
  createVirtualAccount(payload: { userId: string; [key: string]: unknown }) {
    return this.request<unknown>("createvirtualaccount", { method: "POST", body: payload })
  }

  getVirtualAccount(query: { userId?: string; accountNumber?: string }) {
    return this.request<unknown>("getvirtualaccount", { method: "GET", query })
  }

  // New: Get virtual account details using requestId (per docs)
  getVirtualAccountByRequestId(payload: { requestId: string }) {
    return this.request<unknown>("getvirtualaccount", { method: "POST", body: payload })
  }

  // ============ Transactions & Asset Management ==========
  cngnOnramp(payload: { [key: string]: unknown }) {
    return this.request<unknown>("cngnonramp", { method: "POST", body: payload })
  }

  cngnOfframp(payload: { [key: string]: unknown }) {
    return this.request<unknown>("cngnofframp", { method: "POST", body: payload })
  }

  // Transaction status by correlationId
  getCngnRequestStatus(query: { correlationId: string }) {
    return this.request<unknown>("cngnrequeststatus", { method: "GET", query })
  }

  withdrawAsset(payload: { [key: string]: unknown }) {
    return this.request<unknown>("withdrawasset", { method: "POST", body: payload })
  }

  getWithdrawalHistory(query?: { page?: number; pageSize?: number }) {
    return this.request<unknown>("getwithdrawalhistory", { method: "GET", query })
  }

  fintechRequestWithdrawal(payload: { [key: string]: unknown }) {
    return this.request<unknown>("fintechrequestwithdrawal", { method: "POST", body: payload })
  }

  getAccumulatedFees() {
    return this.request<unknown>("getaccumulatedfees", { method: "GET" })
  }

  manageFees(payload: {
    onrampFee?: {
      percentageFee: number;
      capFee: number;
      enabled: boolean;
    };
    offrampFee?: {
      percentageFee: number;
      capFee: number;
      enabled: boolean;
    };
    metadata?: {
      description?: string;
      notes?: string;
      lastUpdatedBy?: string;
    };
  }) {
    return this.request<{
      status: string;
      message: string;
      data: {
        fintechId: string;
        operation: string;
        feeConfiguration: any;
        exampleCalculation: any;
      };
    }>("managefees", { method: "PUT", body: payload })
  }

  getFees() {
    return this.request<{
      status: string;
      message: string;
      data: {
        fintechId: string;
        hasConfiguration: boolean;
        feeConfiguration: {
          onrampFee?: {
            percentageFee: number;
            capFee: number;
            enabled: boolean;
            metadata?: any;
          };
          offrampFee?: {
            percentageFee: number;
            capFee: number;
            enabled: boolean;
            metadata?: any;
          };
        };
        exampleCalculation: any;
      };
    }>("getfees", { method: "GET" })
  }

  updateAssets(payload: { [key: string]: unknown }) {
    return this.request<unknown>("updateassets", { method: "POST", body: payload })
  }

  cngnRequestStatus(query: { correlationId: string }) {
    return this.request<unknown>("cngnrequeststatus", { method: "GET", query })
  }

  cngnRampStatus(payload: { walletAddress?: string; requestId?: string; [key: string]: unknown }) {
    return this.request<unknown>("cngnrampstatus", { method: "POST", body: payload })
  }

  listUserWallets(payload: { userId: string }) {
    return this.request<unknown>("listuserwallets", { method: "POST", body: payload })
  }

  getBanksCode() {
    return this.request<unknown>("getbankscode", { method: "GET" })
  }

  tokenWithdrawal(payload: {
    userId: string;
    toAddress: string;
    amount: number;
    asset: string;
    destinationWallet?: string;
    network?: string;
  }) {
    return this.request<{
      transactionId: string;
      correlationId: string;
      status: string;
      from: string;
      to: string;
      amount: number;
      ticker: string;
      initiatedAt: string;
      estimatedGasFee?: number;
      platformFee?: number;
    }>("withdrawasset", { method: "POST", body: payload })
  }

  manualStatusRecovery(query: { uuid: string }) {
    return this.request<unknown>("manualstatusrecovery", { method: "GET", query })
  }

  manualStatusRecoveryBatch(payload: { uuids: string[] }) {
    return this.request<unknown>("manualstatusrecovery", { method: "POST", body: payload })
  }

  // ============ Configuration & Management ==========
  manageIpAllowList(payload: { action: "add" | "remove" | "list"; ipAddress?: string; description?: string }) {
    return this.request<{
      action: string
      ipAddress?: string
      totalIps: number
      message: string
      updatedAt: string
      ipList?: Array<{
        ipAddress: string
        description?: string
        addedAt: string
      }>
    }>("manageipallowlist", { method: "POST", body: payload })
  }

  regenerateApiKey() {
    return this.request<{
      apiKey: string
      rotatedAt: string
    }>("regenerateapikey", { method: "GET" })
  }

  // ============ Webhooks & Third-Party Integration ==========
  setWebhook(payload: { webhookUrl: string; enabled: boolean }) {
    return this.request<{
      webhookUrl: string
      enabled: boolean
      updatedAt: string
    }>("set-webhook", { method: "POST", body: payload })
  }

  getWebhook() {
    return this.request<{
      webhookUrl: string
      enabled: boolean
      lastVerifiedAt: string
    }>("get-webhook", { method: "GET" })
  }

  getBankCodes() {
    return this.request<{
      operationId: string
      requestId: string
      countryCode: string
      totalCount: number
      banks: Array<{
        name: string
        code: string
      }>
    }>("getbankscode", { method: "GET" })
  }

  storePublicKey(payload: { publicKey: string; [key: string]: unknown }) {
    return this.request<unknown>("storepublickey", { method: "POST", body: payload })
  }
}

export function createStablesrailClient(options?: { apiKey?: string; baseUrl?: string }) {
  const apiKey = options?.apiKey || process.env.STABLESRAIL_API_KEY || ""
  const baseUrl = options?.baseUrl || process.env.STABLESRAIL_BASE_URL || "https://beta.stablesrail.io/v1/"
  return new StablesrailClient(apiKey, baseUrl)
}
