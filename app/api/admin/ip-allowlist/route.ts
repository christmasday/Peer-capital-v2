import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth, createAdminResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"

export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const admin = createAdminClient()

    const { data: ipAddresses, error } = await admin
      .from('ip_allowlist')
      .select(`
        id,
        ip_address,
        description,
        created_at,
        updated_at,
        created_by,
        profiles!ip_allowlist_created_by_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching IP allowlist:', error)
      return NextResponse.json({ error: "Failed to fetch IP allowlist" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ipAddresses: ipAddresses || []
    })
  } catch (error) {
    console.error("Error in IP allowlist GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const body = await req.json()
    const { ipAddress, description } = body

    if (!ipAddress) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    // Basic IP validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (!ipRegex.test(ipAddress)) {
      return NextResponse.json({ error: "Invalid IP address format" }, { status: 400 })
    }

    const admin = createAdminClient()

    // First, call Stablesrail to add the IP to their allowlist
    let stablesrailResponse
    try {
      const stablesrail = createStablesrailClient()
      stablesrailResponse = await stablesrail.manageIpAllowList({
        action: "add",
        ipAddress: ipAddress,
        description: description || ''
      })
    } catch (stablesrailError) {
      console.error('Stablesrail IP allowlist error:', stablesrailError)
      if (stablesrailError instanceof StablesrailError) {
        return NextResponse.json({ 
          error: `Failed to add IP to Stablesrail: ${stablesrailError.message}` 
        }, { status: 400 })
      }
      return NextResponse.json({ 
        error: "Failed to add IP to Stablesrail allowlist" 
      }, { status: 500 })
    }

    // If Stablesrail call succeeds, add to our database
    const { data, error } = await admin
      .from('ip_allowlist')
      .insert({
        ip_address: ipAddress,
        description: description || '',
        created_by: authResult.userId
      })
      .select(`
        id,
        ip_address,
        description,
        created_at,
        updated_at,
        created_by,
        profiles!ip_allowlist_created_by_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Error adding IP address to database:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: "IP address already exists" }, { status: 400 })
      }
      return NextResponse.json({ error: "Failed to add IP address" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ipAddress: data,
      stablesrailResponse: stablesrailResponse,
      message: stablesrailResponse?.message || "IP address added successfully to Stablesrail allowlist"
    })
  } catch (error) {
    console.error("Error in IP allowlist POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "IP address ID is required" }, { status: 400 })
    }

    const admin = createAdminClient()

    // First, get the IP address from our database
    const { data: ipRecord, error: fetchError } = await admin
      .from('ip_allowlist')
      .select('ip_address')
      .eq('id', id)
      .single()

    if (fetchError || !ipRecord) {
      console.error('Error fetching IP address:', fetchError)
      return NextResponse.json({ error: "IP address not found" }, { status: 404 })
    }

    // Call Stablesrail to remove the IP from their allowlist
    let stablesrailResponse
    try {
      const stablesrail = createStablesrailClient()
      stablesrailResponse = await stablesrail.manageIpAllowList({
        action: "remove",
        ipAddress: ipRecord.ip_address
      })
    } catch (stablesrailError) {
      console.error('Stablesrail IP allowlist error:', stablesrailError)
      if (stablesrailError instanceof StablesrailError) {
        return NextResponse.json({ 
          error: `Failed to remove IP from Stablesrail: ${stablesrailError.message}` 
        }, { status: 400 })
      }
      return NextResponse.json({ 
        error: "Failed to remove IP from Stablesrail allowlist" 
      }, { status: 500 })
    }

    // If Stablesrail call succeeds, remove from our database
    const { error } = await admin
      .from('ip_allowlist')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting IP address from database:', error)
      return NextResponse.json({ error: "Failed to delete IP address" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      stablesrailResponse: stablesrailResponse,
      message: stablesrailResponse?.message || "IP address removed successfully from Stablesrail allowlist"
    })
  } catch (error) {
    console.error("Error in IP allowlist DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
