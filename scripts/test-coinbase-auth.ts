#!/usr/bin/env ts-node

import 'dotenv/config'

// Use relative import to the lib helper
import { generateCoinbaseJwt } from '../lib/coinbase-cdp/auth'

async function main() {
  const method = (process.argv[2] || 'GET').toUpperCase()
  const path = process.argv[3] || '/v2/evm/token-balances/base/0x0000000000000000000000000000000000000000'
  const envUrl = process.env.COINBASE_CDP_URL || 'https://api.cdp.coinbase.com'
  let host: string
  try {
    host = new URL(envUrl).host
  } catch (e) {
    host = envUrl.replace(/^https?:\/\//, '')
  }

  console.log('--- Coinbase CDP JWT generator test ---')
  console.log('Host:', host)
  console.log('Method:', method)
  console.log('Path:', path)

  const apiKeyId = process.env.COINBASE_CDP_KEY_NAME || process.env.COINBASE_CDP_API_KEY_ID
  const apiKeySecret = process.env.COINBASE_CDP_KEY_SECRET || process.env.COINBASE_CDP_API_KEY_SECRET
  const staticToken = process.env.COINBASE_CDP_API_KEY

  if (!staticToken && (!apiKeyId || !apiKeySecret)) {
    console.error('Missing configuration: either COINBASE_CDP_API_KEY (static) OR COINBASE_CDP_KEY_NAME and COINBASE_CDP_KEY_SECRET must be set in the environment.')
    process.exit(1)
  }

  if (staticToken) {
    console.log('Static API token detected (COINBASE_CDP_API_KEY). This script will still attempt to generate a JWT if key pair is present.')
  }

  try {
    const token = await generateCoinbaseJwt({
      apiKeyId,
      apiKeySecret,
      requestMethod: method,
      requestHost: host,
      requestPath: path,
      expiresIn: 120,
    })

    console.log('\nGenerated JWT:')
    console.log(token)
    console.log('\nSample Authorization header:')
    console.log({ Authorization: `Bearer ${token}` })
  } catch (err: any) {
    console.error('Failed to generate JWT:', err?.message || err)
    process.exit(2)
  }
}

main()
