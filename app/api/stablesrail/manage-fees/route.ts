import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/admin-auth"
import { createStablesrailClient } from "@/lib/stablesrail/client"

export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated || !authResult.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stablesrail = createStablesrailClient()
    const response = await stablesrail.getFees()

    console.log('🔵 [manage-fees GET] Stablesrail response:', JSON.stringify(response, null, 2))

    // The client returns the data object directly, which contains feeConfiguration
    // If no configuration exists yet, return a consistent 200 response
    if (!response || (!response.feeConfiguration && !response.hasConfiguration)) {
      console.log('🔵 [manage-fees GET] No configuration found, returning empty')
      return NextResponse.json({ 
        success: true,
        fees: { hasConfiguration: false, feeConfiguration: {} }
      })
    }

    console.log('🔵 [manage-fees GET] Returning fees:', JSON.stringify({ success: true, fees: response }, null, 2))
    return NextResponse.json({ 
      success: true, 
      fees: response 
    })
  } catch (error) {
    console.error("Error fetching Stablesrail fees:", error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch fees" 
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated || !authResult.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const stablesrail = createStablesrailClient()
    
    const result = await stablesrail.manageFees({
      ...body,
      metadata: {
        ...body.metadata,
        lastUpdatedBy: authResult.userId || "admin"
      }
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to update fees" 
    }, { status: 500 })
  }
}
