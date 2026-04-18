// Wallet Balance & Fee Checking Utility
// Used to verify sufficient funds before initiating token withdrawals

import { getTokenBalance } from "@/lib/base-rpc/client"
import { createStablesrailClient } from "@/lib/stablesrail/client"

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
    // 1. Fetch wallet balance directly via BASE RPC (no relative URL)
    const contractAddress = process.env.NEXT_PUBLIC_CNGN_CONTRACT_ADDRESS || process.env.CNGN_CONTRACT_ADDRESS || ''
    if (!contractAddress) {
      return {
        sufficient: false,
        balance: 0,
        required: amount,
        gasFee: 0,
        platformFee: 0,
        error: "CNGN contract address not configured"
      }
    }

    const balanceStr = await getTokenBalance(contractAddress, walletAddress)
    const balance = parseFloat(balanceStr)

    if (isNaN(balance)) {
      return {
        sufficient: false,
        balance: 0,
        required: amount,
        gasFee: 0,
        platformFee: 0,
        error: "Failed to parse wallet balance"
      }
    }
    
    // 2. Get estimated gas fees
    // TODO: Hardcoded ETH gas fee — this is in ETH units while CNGN is in token units.
    // For a proper check, query BASE RPC for ETH balance separately and verify gas affordability.
    // For now, we omit gas from the CNGN "required" total and only check token amounts.
    const estimatedGasFee = 0.001 // ETH for BASE network (separate denomination)
    
    // 3. Get platform fees from StablesRail API directly (no relative URL)
    let platformFeePercent = 0.5 // Default 0.5%
    try {
      const stablesrail = createStablesrailClient()
      const feesData: any = await stablesrail.getFees()
      platformFeePercent = feesData?.withdrawalFee ?? feesData?.withdrawal_fee ?? 0.5
    } catch {
      // Use default on failure
    }

    const platformFee = (amount * platformFeePercent) / 100
    // NOTE: gasFee is in ETH, not CNGN — do not add to CNGN required total
    const required = amount + platformFee
    
    return {
      sufficient: balance >= required,
      balance,
      required,
      gasFee: estimatedGasFee,
      platformFee
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
