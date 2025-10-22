// BASE RPC Client Utility
// Used to interact with BASE network RPC endpoints

export async function getBaseWalletBalance(walletAddress: string): Promise<string> {
  const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
  
  const response = await fetch(BASE_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [walletAddress, 'latest']
    })
  })
  
  if (!response.ok) {
    throw new Error(`RPC request failed: ${response.status}`)
  }
  
  const data = await response.json()
  
  if (data.error) {
    throw new Error(`RPC error: ${data.error.message}`)
  }
  
  // Convert hex balance (in wei) to decimal ETH
  const balanceWei = BigInt(data.result)
  const balanceEth = Number(balanceWei) / 1e18
  
  return balanceEth.toFixed(6) // Return as string with 6 decimal places
}
