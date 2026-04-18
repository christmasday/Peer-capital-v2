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
  private readonly debug: boolean

  constructor(apiKey: string, baseUrl = "https://beta.stablesrail.io/v1/") {
    if (!apiKey) {
      throw new Error("STABLESRAIL_API_KEY is required to use StablesrailClient")
    }
    this.apiKey = apiKey
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
    this.debug = process.env.NODE_ENV !== "production"
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

    if (this.debug) console.log(`🔵 [StablesrailClient] ${method} ${path} - HTTP ${res.status}`)

    // Get response text first to handle both JSON and non-JSON responses
    const responseText = await res.text()
    if (this.debug) console.log(`🔵 [StablesrailClient] ${method} ${path} - Response length: ${responseText.length}`)

    // Check if response is HTML (likely an error page or API documentation)
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      const errorMsg = `Endpoint ${path} returned HTML instead of JSON. This endpoint may not exist or may require different parameters.`
      console.error(`🔴 [StablesrailClient] ${method} ${path} - HTML response detected:`, errorMsg)
      throw new StablesrailError(
        errorMsg,
        res.status,
        { 
          rawResponse: responseText.substring(0, 500),
          isHtmlResponse: true,
          endpoint: path
        }
      )
    }

    let json: any
    try {
      json = responseText ? JSON.parse(responseText) : {}
    } catch (e) {
      console.error('🔴 [StablesrailClient] JSON parse error:', e, 'Response text:', responseText.substring(0, 200))
      // If status is not 2xx, this is likely an error
      if (!res.ok) {
        throw new StablesrailError(
          `HTTP ${res.status}: ${responseText || res.statusText}`,
          res.status,
          { rawResponse: responseText.substring(0, 500) }
        )
      }
      throw new Error(`Failed to parse response as JSON: ${e instanceof Error ? e.message : String(e)}`)
    }

    if (this.debug) console.log(`🔵 [StablesrailClient] ${method} ${path} - Parsed JSON OK`)

    // Check HTTP status code - even if JSON parses, non-2xx might indicate error
    if (!res.ok && res.status >= 400) {
      const errorMessage = json?.message || json?.error || responseText || `HTTP ${res.status} ${res.statusText}`
      const errorCode = json?.response_code || json?.code || res.status
      console.error('🔴 [StablesrailClient] HTTP error response:', { status: res.status, json })
      throw new StablesrailError(errorMessage, errorCode, json?.data || json)
    }

    // Handle empty response
    if (!json || Object.keys(json).length === 0) {
      console.warn(`⚠️ [StablesrailClient] ${method} ${path} - Empty response from Stablesrail`)
      throw new StablesrailError(`Empty response from Stablesrail API for ${method} ${path}`, 0, null)
    }

    // The API uses a status field to indicate success/error
    // Check for error status (case-insensitive)
    const status = (json as any)?.status?.toLowerCase?.() || (json as any)?.status
    if (status === "error") {
      const err = json as StablesrailErrorResponse
      console.error('🔴 [StablesrailClient] Error response:', err)
      throw new StablesrailError(err.message || "Stablesrail API error", err.response_code, err.data)
    }

    // Handle various success status formats (status is already lowercased)
    if (status === "success") {
      const ok = json as StablesrailSuccessResponse<T>
      const data = ok.data
      if (data === undefined) {
        console.warn(`⚠️ [StablesrailClient] ${method} ${path} - Success status but data is undefined`)
        throw new StablesrailError(`Success response but data is undefined for ${method} ${path}`, 0, null)
      }
      if (this.debug) console.log(`🔵 [StablesrailClient] ${method} ${path} - Success`)
      return data
    }

    // If response has data field but status doesn't match, try to extract data anyway
    if ((json as any)?.data !== undefined) {
      const data = (json as any).data
      if (this.debug) console.log(`🔵 [StablesrailClient] ${method} ${path} - Returning data (status: ${status})`)
      return data
    }

    // Log unexpected response format but return the json anyway
    console.warn(`⚠️ [StablesrailClient] ${method} ${path} - Unexpected response format (status: ${status}), returning entire response`)
    console.warn(`⚠️ [StablesrailClient] Response keys:`, Object.keys(json))
    return json as unknown as T
  }

  // ============ User Management & Authentication ==========
  onboardUser(payload: {
    // Exact fields depend on onboarding integration; accept generic payload
    [key: string]: unknown
  }) {
    return this.request<unknown>("onboarduser", { method: "POST", body: payload })
  }

  verifyOtp(payload: { sessionId?: string; code?: string; [key: string]: unknown }) {
    return this.request<unknown>("verifyotp", { method: "POST", body: payload })
  }

  getOnboardStatus(payload: { requestId: string }) {
    return this.request<unknown>("onboardstatus", { method: "POST", body: payload })
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

  cngnOnrampStatus(payload: { requestId: string }) {
    return this.request<unknown>("cngnonrampstatus", { method: "POST", body: payload })
  }

  cngnOfframpStatus(payload: { requestId: string }) {
    return this.request<unknown>("cngnofframpstatus", { method: "POST", body: payload })
  }

  listUserWallets(payload: { userId: string }) {
    return this.request<unknown>("listuserwallets", { method: "POST", body: payload })
  }

  tokenWithdrawal(payload: {
    userId: string;
    internalWallet: string;
    destinationWallet: string;
    amount: number;
    ticker: string;
    network?: string;
  }) {
    return this.request<{
      withdrawalId: string;
      from: string;
      to: string;
      amount: string;
      ticker: string;
      network: string;
      initiatedAt: string;
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
