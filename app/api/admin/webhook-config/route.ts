import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth, createAdminResponse } from "@/lib/admin-auth"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"

export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    // Call Stablesrail get-webhook endpoint
    const stablesrail = createStablesrailClient()
    const stablesrailResponse = await stablesrail.getWebhook()
    
    return NextResponse.json({
      success: true,
      webhookConfig: stablesrailResponse ? {
        webhookUrl: stablesrailResponse.webhookUrl,
        enabled: stablesrailResponse.enabled,
        lastVerifiedAt: stablesrailResponse.lastVerifiedAt
      } : null,
      stablesrailResponse
    })
  } catch (error) {
    console.error("Error in webhook config GET:", error)
    if (error instanceof StablesrailError) {
      return NextResponse.json({ 
        error: `Stablesrail API error: ${error.message}`,
        success: false 
      }, { status: 400 })
    }
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
    const { webhookUrl, enabled = true } = body

    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 })
    }

    // Basic URL validation
    try {
      new URL(webhookUrl)
    } catch {
      return NextResponse.json({ error: "Invalid webhook URL format" }, { status: 400 })
    }

    // Call Stablesrail set-webhook endpoint
    const stablesrail = createStablesrailClient()
    const stablesrailResponse = await stablesrail.setWebhook({
      webhookUrl: webhookUrl,
      enabled: enabled
    })

    return NextResponse.json({
      success: true,
      webhookConfig: {
        webhookUrl: stablesrailResponse.webhookUrl,
        enabled: stablesrailResponse.enabled,
        updatedAt: stablesrailResponse.updatedAt
      },
      stablesrailResponse,
      message: "Webhook configuration updated successfully"
    })
  } catch (error) {
    console.error("Error in webhook config POST:", error)
    if (error instanceof StablesrailError) {
      return NextResponse.json({ 
        error: `Stablesrail API error: ${error.message}`,
        success: false 
      }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    // Call Stablesrail set-webhook endpoint with disabled state
    const stablesrail = createStablesrailClient()
    const stablesrailResponse = await stablesrail.setWebhook({
      webhookUrl: "",
      enabled: false
    })

    return NextResponse.json({
      success: true,
      stablesrailResponse,
      message: "Webhook configuration disabled successfully"
    })
  } catch (error) {
    console.error("Error in webhook config DELETE:", error)
    if (error instanceof StablesrailError) {
      return NextResponse.json({ 
        error: `Stablesrail API error: ${error.message}`,
        success: false 
      }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
