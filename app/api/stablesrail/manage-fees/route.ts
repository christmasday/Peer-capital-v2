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

    // Handle the case where Stablesrail returns an error or no data
    if (!response || !response.data) {
      return NextResponse.json({ 
        success: false, 
        error: "No fee configuration found" 
      }, { status: 404 })
    }

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
