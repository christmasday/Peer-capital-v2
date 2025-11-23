
// Consolidated BASE wallet & token balance helpers
// - getBaseWalletBalance(walletAddress): returns native BASE balance as decimal string (6 dp)
// - getTokenBalance(contractAddress, walletAddress): returns ERC-20 token balance as decimal string (6 dp)
// Uses Coinbase CDP SDK/REST when available and falls back to JSON-RPC eth_* calls.

const DEFAULT_COINBASE_CDP_URL = process.env.COINBASE_CDP_URL || 'https://api.cdp.coinbase.com'
const DEFAULT_BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org'

const pow10 = (n: number) => BigInt('1' + '0'.repeat(Math.max(0, n)))

async function tryCoinbaseTokenBalances(address: string) {
  try {
    const { createCoinbaseClient, getCoinbaseAuthHeader } = await import('@/lib/coinbase-cdp/auth')
    const client = await createCoinbaseClient()

    if (client) {
      try {
        if (client.evm && client.evm.tokenBalances && typeof client.evm.tokenBalances.list === 'function') {
          const sdkRes = await client.evm.tokenBalances.list({ network: 'base', address })
          return sdkRes?.balances || sdkRes?.data || null
        }
        if (client.tokenBalances && typeof client.tokenBalances.list === 'function') {
          const sdkRes = await client.tokenBalances.list({ network: 'base', address })
          return sdkRes?.balances || sdkRes?.data || null
        }
      } catch (err) {
        console.warn('Coinbase SDK tokenBalances.list failed', err)
      }
    }

    const headers = getCoinbaseAuthHeader()
    const url = `${DEFAULT_COINBASE_CDP_URL.replace(/\/$/, '')}/v2/evm/token-balances/base/${encodeURIComponent(address)}`
    const resp = await fetch(url, { method: 'GET', headers })
    if (!resp.ok) {
      const body = await resp.text().catch(() => '')
      console.warn(`Coinbase REST failed ${resp.status}: ${body}`)
      return null
    }
    const data = await resp.json()
    return data?.balances || null
  } catch (err) {
    console.warn('Coinbase token balances unavailable', err)
    return null
  }
}

function formatBigIntAmount(amountBig: bigint, decimals: number, outDecimals = 6): string {
  const unit = pow10(decimals)
  const scale = pow10(outDecimals)
  const whole = amountBig / unit
  const fractional = ((amountBig % unit) * scale) / unit
  return `${whole.toString()}.${fractional.toString().padStart(outDecimals, '0')}`
}

export async function getBaseWalletBalance(walletAddress: string): Promise<string> {
  if (!walletAddress) throw new Error('walletAddress required')

  // Try Coinbase balances first for native entry
  const balances = await tryCoinbaseTokenBalances(walletAddress)
  if (Array.isArray(balances)) {
    const native = balances.find((b: any) => !b?.token?.contractAddress) || balances.find((b: any) => (b.token?.network || '').toLowerCase() === 'base')
    if (native) {
      const amountStr = native.amount?.amount
      const decimals = Number(native.amount?.decimals ?? 18)
      if (amountStr) {
        try {
          return formatBigIntAmount(BigInt(amountStr), decimals, 6)
        } catch (e) {
          // fall through to RPC
        }
      }
    }
  }

  // RPC fallback: eth_getBalance
  const response = await fetch(DEFAULT_BASE_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'eth_getBalance', params: [walletAddress, 'latest'] }),
  })
  if (!response.ok) throw new Error(`RPC request failed: ${response.status}`)
  const data = await response.json()
  if (data.error) throw new Error(`RPC error: ${data.error.message}`)
  if (!data.result) return '0.000000'
  const balanceWei = BigInt(data.result)
  return formatBigIntAmount(balanceWei, 18, 6)
}

export async function getTokenBalance(contractAddress: string, walletAddress: string): Promise<string> {
  if (!contractAddress) throw new Error('contractAddress required')
  if (!walletAddress) throw new Error('walletAddress required')
  const normalizedContract = contractAddress.trim().toLowerCase()

  // Try Coinbase balances first
  const balances = await tryCoinbaseTokenBalances(walletAddress)
  if (Array.isArray(balances)) {
    const found = balances.find((b: any) => (b.token?.contractAddress || '').toLowerCase() === normalizedContract)
    if (found) {
      const amountStr = found.amount?.amount
      const decimals = Number(found.amount?.decimals ?? 18)
      if (amountStr) {
        try {
          return formatBigIntAmount(BigInt(amountStr), decimals, 6)
        } catch (e) {
          // fall through to RPC
        }
      }
    }
  }

  // RPC fallback: eth_call balanceOf + decimals
  const encodeAddressParam = (addr: string) => addr.toLowerCase().replace(/^0x/, '').padStart(64, '0')
  const balanceOfSelector = '0x70a08231'
  const balanceOfData = balanceOfSelector + encodeAddressParam(walletAddress)
  const callBody = { jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: contractAddress, data: balanceOfData }, 'latest'] }
  const res = await fetch(DEFAULT_BASE_RPC_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(callBody) })
  if (!res.ok) throw new Error(`RPC eth_call failed: ${res.status}`)
  const resJson = await res.json()
  if (resJson.error) throw new Error(`RPC error: ${resJson.error.message}`)
  const rawBalanceHex = resJson.result
  if (!rawBalanceHex) return '0.000000'
  const balBig = BigInt(rawBalanceHex)

  // decimals()
  const decimalsSelector = '0x313ce567'
  const decCall = { jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: contractAddress, data: decimalsSelector }, 'latest'] }
  const decRes = await fetch(DEFAULT_BASE_RPC_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(decCall) })
  let decimals = 18
  if (decRes.ok) {
    const decJson = await decRes.json()
    if (decJson?.result) {
      try {
        decimals = Number(BigInt(decJson.result).toString())
      } catch (e) {
        decimals = 18
      }
    }
  }

  return formatBigIntAmount(balBig, decimals, 6)
}

export default getBaseWalletBalance

