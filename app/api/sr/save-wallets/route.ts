import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

// Ethereum address format validation
const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAuth(true)
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
    const wallets = body.wallets || []

    if (!Array.isArray(wallets) || wallets.length === 0) {
      return NextResponse.json({ error: "wallets array is required" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Get the first wallet address (primary) - store in base_address as it's most commonly used
    // Additional wallets can be stored in other chain columns if needed
    const primaryWallet = wallets[0]
    const walletAddress = primaryWallet.walletAddress

    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required in wallet data" }, { status: 400 })
    }

    // Validate Ethereum address format
    if (!ETH_ADDRESS_RE.test(walletAddress)) {
      return NextResponse.json({ error: "Invalid Ethereum wallet address format" }, { status: 400 })
    }

    // Prepare wallet record - store primary wallet in base_address
    // Since addresses are 0x format (Ethereum-style), we'll also store in ethereum_address
    const walletRecord = {
      user_id: auth.userId,
      wallet_address: walletAddress, // Keep for backward compatibility
      base_address: walletAddress, // Primary storage location
      ethereum_address: walletAddress, // Since it's 0x format
      request_id: null,
      account_number: null,
      updated_at: new Date().toISOString(),
    }

    // If there are multiple wallets, we could store them in other chain columns
    // For now, we'll just store the primary one and log if there are more
    if (wallets.length > 1) {
      console.log(`User ${auth.userId} has ${wallets.length} wallets, storing primary wallet only`)
    }

    // Upsert to wallet_address table (one row per user)
    const { data, error } = await admin
      .from('wallet_address')
      .upsert(walletRecord, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('Error saving wallets:', error)
      return NextResponse.json({ 
        error: "Failed to save wallets to database",
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...data,
        totalWallets: wallets.length,
      }
    })
  } catch (error) {
    console.error("Error in save-wallets:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

