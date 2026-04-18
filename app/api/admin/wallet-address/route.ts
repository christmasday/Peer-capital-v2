import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated || !authResult.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()
    
    // Get wallet address from admin_config table
    const { data: walletConfig, error } = await adminClient
      .from("admin_config")
      .select("config_value")
      .eq("config_key", "admin_wallet_address")
      .maybeSingle()
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching admin wallet address:", error)
      // If table doesn't exist, return empty string (graceful degradation)
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          success: true, 
          walletAddress: ""
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const walletAddress = walletConfig?.config_value || ""

    return NextResponse.json({ 
      success: true, 
      walletAddress
    })
  } catch (error) {
    console.error("Error in GET admin wallet-address:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated || !authResult.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { walletAddress } = body

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Basic validation
    const trimmedAddress = walletAddress.trim()
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
      return NextResponse.json({ 
        error: "Invalid wallet address format. Must be 0x followed by 40 hexadecimal characters" 
      }, { status: 400 })
    }

    const adminClient = createAdminClient()
    
    // Upsert wallet address in admin_config table
    const { error } = await adminClient
      .from("admin_config")
      .upsert({
        config_key: "admin_wallet_address",
        config_value: trimmedAddress,
        updated_at: new Date().toISOString(),
        updated_by: authResult.userId
      }, {
        onConflict: "config_key"
      })
    
    if (error) {
      console.error("Error saving admin wallet address:", error)
      // If table doesn't exist, provide helpful error message
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: "Admin config table not found. Please run the migration to create admin_config table." 
        }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in PUT admin wallet-address:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 })
  }
}

