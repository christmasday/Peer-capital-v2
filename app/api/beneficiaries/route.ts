import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: NextRequest) {
  try {
    const auth = await checkAuth(true)
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = createAdminClient()
    
    // Fetch beneficiaries for the current user
    const { data: beneficiaries, error } = await admin
      .from('transfer_beneficiaries')
      .select('*')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching beneficiaries:", error)
      return NextResponse.json({ error: "Failed to fetch beneficiaries" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      beneficiaries: beneficiaries || []
    })
  } catch (error) {
    console.error("Error in beneficiaries GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAuth(true)
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { account_name, account_number, bank_name, bank_code, recipient_code } = body

    // Validate required fields
    if (!account_name || !account_number || !bank_name || !bank_code) {
      return NextResponse.json({ 
        error: "account_name, account_number, bank_name, and bank_code are required" 
      }, { status: 400 })
    }

    const admin = createAdminClient()

    // Check if beneficiary already exists for this user with same account number and bank
    const { data: existing } = await admin
      .from('transfer_beneficiaries')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('account_number', account_number)
      .eq('bank_code', bank_code)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ 
        error: "This account already exists in your beneficiaries list" 
      }, { status: 400 })
    }

    // Insert new beneficiary
    const { data: beneficiary, error } = await admin
      .from('transfer_beneficiaries')
      .insert({
        user_id: auth.userId,
        account_name,
        account_number,
        bank_name,
        bank_code,
        recipient_code: recipient_code || null, // Optional, for backward compatibility
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating beneficiary:", error)
      
      // Check if table doesn't exist
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: "Beneficiaries table not found. Please run the migration to create beneficiaries table." 
        }, { status: 500 })
      }
      
      return NextResponse.json({ error: error.message || "Failed to create beneficiary" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      beneficiary
    })
  } catch (error) {
    console.error("Error in beneficiaries POST:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await checkAuth(true)
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Delete beneficiary (only if it belongs to the user)
    const { error } = await admin
      .from('transfer_beneficiaries')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.userId)

    if (error) {
      console.error("Error deleting beneficiary:", error)
      return NextResponse.json({ error: error.message || "Failed to delete beneficiary" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in beneficiaries DELETE:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 })
  }
}

