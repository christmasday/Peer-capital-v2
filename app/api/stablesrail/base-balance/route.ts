import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-utils"
import { getBaseWalletBalance } from "@/lib/base-rpc/client"

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAuth()
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const walletAddress = searchParams.get('address')
    
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const balance = await getBaseWalletBalance(walletAddress)
    
    return NextResponse.json({ 
      success: true, 
      balance: balance,
      network: 'BASE'
    })
  } catch (error) {
    console.error("Error fetching BASE balance:", error)
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
  }
}
