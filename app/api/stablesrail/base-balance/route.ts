import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-utils"
import { getBaseWalletBalance, getTokenBalance } from "@/lib/base-rpc/client"

export async function GET(req: NextRequest) {
  try {
    // Use preventRedirect to avoid NEXT_REDIRECT errors in API routes
    const auth = await checkAuth(true)
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const walletAddress = searchParams.get('address')
    // Optional ERC-20 contract address via query param. If not provided,
    // fall back to the CNGN contract address from environment variables.
    let contract = searchParams.get('contract')
    if (!contract) {
      contract = process.env.CNGN_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CNGN_CONTRACT_ADDRESS || null
    }

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // If a contract param is provided, attempt to return the token balance for that ERC-20
    if (contract) {
      try {
        const tokenBalance = await getTokenBalance(contract, walletAddress)
        return NextResponse.json({ success: true, balance: tokenBalance, network: 'BASE' })
      } catch (err) {
        console.error('Error fetching token balance:', err)
        return NextResponse.json({ error: 'Failed to fetch token balance' }, { status: 500 })
      }
    }

    const balance = await getBaseWalletBalance(walletAddress)

    return NextResponse.json({ 
      success: true, 
      balance: balance,
      network: 'BASE'
    })
  } catch (error: any) {
    // Check if this is a Next.js redirect error - if so, return 401 instead
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error fetching BASE balance:", error)
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
  }
}
