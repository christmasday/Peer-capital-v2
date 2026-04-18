// Simple Coinbase CDP auth helper
// Returns headers for requests to Coinbase CDP using a Bearer API token

// Coinbase CDP auth and client helper
// Exports helpers to obtain a Bearer header and to create an SDK client if available.

export function getCoinbaseAuthHeader() {
  const token = process.env.COINBASE_CDP_API_KEY
  if (!token) {
    throw new Error('COINBASE_CDP_API_KEY is not configured')
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

// Generate a short-lived JWT Bearer token for a specific request using
// a Coinbase CDP secret API key pair. This uses the SDK helper when
// available. Caller should provide the request method/path/host used
// to call the CDP endpoint being signed.
export async function generateCoinbaseJwt(opts: {
  apiKeyId?: string
  apiKeySecret?: string
  requestMethod: string
  requestHost?: string
  requestPath: string
  expiresIn?: number
}) {
  const apiKeyId = opts.apiKeyId || process.env.COINBASE_CDP_KEY_NAME || process.env.COINBASE_CDP_API_KEY_ID
  const apiKeySecret = opts.apiKeySecret || process.env.COINBASE_CDP_KEY_SECRET || process.env.COINBASE_CDP_API_KEY_SECRET
  const requestHost = opts.requestHost || process.env.COINBASE_CDP_URL?.replace(/^https?:\/\//, '') || 'api.cdp.coinbase.com'
  const expiresIn = typeof opts.expiresIn === 'number' ? opts.expiresIn : 120

  if (!apiKeyId || !apiKeySecret) {
    throw new Error('Coinbase CDP key pair not configured. Set COINBASE_CDP_KEY_NAME and COINBASE_CDP_KEY_SECRET')
  }

  // Prefer SDK-provided generator when available
  try {
    const authModule = await import('@coinbase/cdp-sdk/auth')
    const generateJwt = authModule.generateJwt || authModule.default?.generateJwt
    if (typeof generateJwt === 'function') {
      const token = await generateJwt({
        apiKeyId,
        apiKeySecret,
        requestMethod: opts.requestMethod,
        requestHost,
        requestPath: opts.requestPath,
        expiresIn,
      })
      return token
    }
  } catch (err) {
    // ignore and fallthrough to error below
  }

  throw new Error('Coinbase CDP SDK auth helper not available. Install @coinbase/cdp-sdk or provide COINBASE_CDP_API_KEY')
}

// Produce an Authorization header suitable for calling a Coinbase CDP endpoint.
// If `COINBASE_CDP_API_KEY` is present it will be used directly. Otherwise
// this will attempt to generate a request-scoped JWT using the secret key pair.
export async function getCoinbaseAuthHeaderForRequest(opts: {
  method: string
  path: string
  host?: string
  expiresIn?: number
}) {
  // If a static API token is configured prefer it
  const staticToken = process.env.COINBASE_CDP_API_KEY
  if (staticToken) return { Authorization: `Bearer ${staticToken}`, 'Content-Type': 'application/json' }

  const jwt = await generateCoinbaseJwt({
    requestMethod: opts.method,
    requestPath: opts.path,
    requestHost: opts.host,
    expiresIn: opts.expiresIn || 120,
  })

  return { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' }
}

// Try to create and return an SDK client instance (if the SDK is installed and token provided).
// This function performs a dynamic import so it won't crash environments where the SDK isn't present.
export async function createCoinbaseClient() {
  const token = process.env.COINBASE_CDP_API_KEY
  const baseUrl = process.env.COINBASE_CDP_URL || 'https://api.cdp.coinbase.com'
  if (!token) return null

  try {
    const sdk = await import('@coinbase/cdp-sdk')
    const anySdk = sdk as any
    // SDKs vary in exports; try common constructor/factory patterns
    const ClientFactory = anySdk.Client || anySdk.CoinbaseCDP || anySdk.default || anySdk.createClient || anySdk
    if (!ClientFactory) return null

    // Try to instantiate or call factory with apiKey/baseUrl
    try {
      if (typeof ClientFactory === 'function') {
        // Some SDKs export a constructor
        try {
          return new ClientFactory({ apiKey: token, baseUrl })
        } catch (e) {
          // Try calling as factory
          try {
            return ClientFactory({ apiKey: token, baseUrl })
          } catch (e2) {
            // fallthrough to next try
          }
        }
      }

      // If default export is an object with a create method
      if (anySdk.default && typeof anySdk.default.create === 'function') {
        return anySdk.default.create({ apiKey: token, baseUrl })
      }

      // As a last resort, return the raw SDK object
      return anySdk
    } catch (err2) {
      return null
    }
  } catch (err) {
    return null
  }
}

export default getCoinbaseAuthHeader
