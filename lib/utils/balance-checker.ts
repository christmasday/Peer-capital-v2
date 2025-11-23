// Wallet Balance & Fee Checking Utility
// Used to verify sufficient funds before initiating token withdrawals

export async function checkSufficientBalance({
  walletAddress,
  amount,
  asset,
  network = "BASE"
}: {
  walletAddress: string;
  amount: number;
  asset: string;
  network?: string;
}): Promise<{
  sufficient: boolean;
  balance: number;
  required: number;
  gasFee: number;
  platformFee: number;
  error?: string;
}> {
  try {
    // 1. Fetch wallet balance using BASE RPC
    const contractEnv = process.env.NEXT_PUBLIC_CNGN_CONTRACT_ADDRESS || process.env.CNGN_CONTRACT_ADDRESS || ''
    const contractQuery = contractEnv ? `&contract=${encodeURIComponent(contractEnv)}` : ''
    const balanceRes = await fetch(
      `/api/stablesrail/base-balance?address=${walletAddress}${contractQuery}`
    )
    const balanceData = await balanceRes.json()
    
    if (!balanceRes.ok) {
      return {
        sufficient: false,
        balance: 0,
        required: amount,
        gasFee: 0,
        platformFee: 0,
        error: "Failed to fetch wallet balance"
      }
    }
    
    const balance = parseFloat(balanceData.balance)
    
    // 2. Get estimated gas fees from Stablesrail (or hardcoded estimate)
    const estimatedGasFee = 0.001 // ETH for BASE network (adjust as needed)
    
    // 3. Get platform fees from Stablesrail API
    try {
      const feesRes = await fetch('/api/stablesrail/get-fees')
      const feesData = await feesRes.json()
      const platformFeePercent = feesData.withdrawalFee || 0.5 // Default 0.5%
      const platformFee = (amount * platformFeePercent) / 100
      
      // 4. Calculate total required
      const required = amount + estimatedGasFee + platformFee
      
      return {
        sufficient: balance >= required,
        balance,
        required,
        gasFee: estimatedGasFee,
        platformFee
      }
    } catch (error) {
      // If fees API fails, use default platform fee
      const platformFee = (amount * 0.5) / 100 // Default 0.5%
      const required = amount + estimatedGasFee + platformFee
      
      return {
        sufficient: balance >= required,
        balance,
        required,
        gasFee: estimatedGasFee,
        platformFee
      }
    }
  } catch (error) {
    return {
      sufficient: false,
      balance: 0,
      required: amount,
      gasFee: 0,
      platformFee: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}
