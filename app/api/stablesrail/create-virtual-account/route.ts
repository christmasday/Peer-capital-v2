import { NextRequest, NextResponse } from "next/server"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    console.log('🔵 [create-virtual-account] Starting request')
    
    // Check authentication (prevent redirect in API routes)
    const authResult = await checkAuth(true)
    if (!authResult.authenticated || !authResult.userId) {
      console.error('🔴 [create-virtual-account] Authentication failed')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🔵 [create-virtual-account] User authenticated:', authResult.userId)

    const admin = createAdminClient()
    
    // Get user profile to fetch sr_user_id
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('sr_user_id')
      .eq('id', authResult.userId)
      .single()

    if (profileError) {
      console.error('🔴 [create-virtual-account] Profile error:', profileError)
      return NextResponse.json({ 
        error: "Failed to fetch user profile",
        details: profileError.message
      }, { status: 500 })
    }

    if (!profile?.sr_user_id) {
      console.error('🔴 [create-virtual-account] No sr_user_id found for user:', authResult.userId)
      return NextResponse.json({ 
        error: "User not onboarded with Stablesrail. Please complete BVN verification first." 
      }, { status: 400 })
    }

    console.log('🔵 [create-virtual-account] sr_user_id:', profile.sr_user_id)

    // Check if virtual account already exists
    const { data: existingVA } = await admin
      .from('virtual_accounts')
      .select('*')
      .eq('user_id', authResult.userId)
      .single()

    if (existingVA) {
      // Return existing virtual account
      const { data: existingWallet } = await admin
        .from('wallet_address')
        .select('*')
        .eq('user_id', authResult.userId)
        .single()

      return NextResponse.json({
        success: true,
        requestId: existingVA.request_id,
        virtualAccount: existingVA,
        wallet: existingWallet,
        message: "Virtual account already exists"
      })
    }

    // Create virtual account with Stablesrail
    const stablesrail = createStablesrailClient()
    const payload = {
      userId: profile.sr_user_id
    }
    console.log('🔵 [create-virtual-account] Creating with Stablesrail, payload:', JSON.stringify(payload, null, 2))
    
    let createResult: any
    try {
      createResult = await stablesrail.createVirtualAccount(payload)
      console.log('🔵 [create-virtual-account] Stablesrail response:', JSON.stringify(createResult, null, 2))
    } catch (stablesrailError) {
      console.error('🔴 [create-virtual-account] Stablesrail API error:', stablesrailError)
      if (stablesrailError instanceof StablesrailError) {
        return NextResponse.json(
          { 
            error: stablesrailError.message, 
            code: stablesrailError.responseCode, 
            details: stablesrailError.details 
          },
          { status: 400 }
        )
      }
      throw stablesrailError
    }

    // The client returns just the data field, so check for requestId directly
    // Handle various possible response structures
    const requestId = 
      createResult?.requestId || 
      createResult?.data?.requestId ||
      (typeof createResult === 'string' ? createResult : null)
    
    console.log('🔵 [create-virtual-account] Extracted requestId:', requestId)
    console.log('🔵 [create-virtual-account] Full createResult structure:', JSON.stringify(createResult, null, 2))
    
    if (!requestId) {
      console.error('🔴 [create-virtual-account] No requestId found in response')
      console.error('🔴 [create-virtual-account] createResult type:', typeof createResult)
      console.error('🔴 [create-virtual-account] createResult:', JSON.stringify(createResult, null, 2))
      console.error('🔴 [create-virtual-account] createResult keys:', createResult && typeof createResult === 'object' ? Object.keys(createResult) : 'N/A')
      
      return NextResponse.json({ 
        error: "Failed to create virtual account with Stablesrail: No requestId in response",
        details: {
          createResult,
          createResultType: typeof createResult,
          hasRequestId: !!createResult?.requestId,
          hasDataRequestId: !!createResult?.data?.requestId
        }
      }, { status: 500 })
    }

    // Persist requestId immediately as placeholder
    try {
      await admin.from('virtual_accounts').upsert({
        user_id: authResult.userId,
        account_number: '', // Will be updated when we get the actual VA
        account_name: '', // Will be updated when we get the actual VA
        bank_name: '',
        bank_code: '',
        currency: 'NGN',
        assigned: false, // Will be updated when we get the actual VA
        request_id: requestId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email: null,
      }, { onConflict: 'user_id' })
    } catch (error) {
      console.error("Error persisting requestId:", error)
      // Continue even if persistence fails
    }

    // Immediately poll getvirtualaccount to fetch VA details
    let virtualAccount = null
    let wallet = null
    let pollingSuccess = false

    try {
      const getResult: any = await stablesrail.getVirtualAccountByRequestId({ requestId })
      
      if (getResult && getResult.data) {
        const data = getResult.data
        const va = data.virtualAccount
        const walletAddress = data.walletAddress

        if (va) {
          // Update virtual account with actual details
          const vaRecord = {
            user_id: authResult.userId,
            account_number: String(va.accountNumber || ''),
            account_name: String(va.accountName || ''),
            bank_name: 'Stablesrail',
            bank_code: 'STABLESRAIL',
            currency: String(va.currency || 'NGN'),
            assigned: Boolean(va.accountStatus ?? true),
            request_id: String(requestId),
            updated_at: new Date().toISOString(),
            email: null,
          }

          const { data: vaData } = await admin
            .from('virtual_accounts')
            .upsert(vaRecord, { onConflict: 'user_id' })
            .select()
            .single()
          
          virtualAccount = vaData

          // Persist wallet address if available
          if (walletAddress) {
            const walletRecord = {
              user_id: authResult.userId,
              wallet_address: String(walletAddress), // Keep for backward compatibility
              base_address: String(walletAddress), // Save to Base blockchain column
              request_id: String(requestId),
              account_number: String(va.accountNumber || ''),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }

            const { data: walletData } = await admin
              .from('wallet_address')
              .upsert(walletRecord, { onConflict: 'user_id' })
              .select()
              .single()
            
            wallet = walletData
          }

          pollingSuccess = true
        }
      }
    } catch (error) {
      console.error("Error polling getvirtualaccount:", error)
      // Continue even if polling fails
    }

    return NextResponse.json({
      success: true,
      requestId,
      virtualAccount,
      wallet,
      polling: pollingSuccess,
      message: pollingSuccess 
        ? "Virtual account created and details fetched successfully"
        : "Virtual account creation initiated. Details will be available shortly."
    })

  } catch (error) {
    console.error("🔴 [create-virtual-account] Unexpected error:", error)
    
    if (error instanceof StablesrailError) {
      return NextResponse.json(
        { error: error.message, code: error.responseCode, details: error.details },
        { status: 400 }
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error("🔴 [create-virtual-account] Error details:", { errorMessage, errorStack })
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 })
  }
}