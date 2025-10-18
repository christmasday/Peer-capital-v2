import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth, createAdminResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"

export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const admin = createAdminClient()

    const { data: webhookConfig, error } = await admin
      .from('webhook_config')
      .select(`
        id,
        webhook_url,
        secret,
        enabled,
        created_at,
        updated_at,
        created_by,
        profiles!webhook_config_created_by_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching webhook config:', error)
      return NextResponse.json({ error: "Failed to fetch webhook config" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      webhookConfig: webhookConfig || null
    })
  } catch (error) {
    console.error("Error in webhook config GET:", error)
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
    const { webhookUrl, secret, enabled = true } = body

    if (!webhookUrl || !secret) {
      return NextResponse.json({ error: "Webhook URL and secret are required" }, { status: 400 })
    }

    // Basic URL validation
    try {
      new URL(webhookUrl)
    } catch {
      return NextResponse.json({ error: "Invalid webhook URL format" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Check if webhook config already exists
    const { data: existingConfig } = await admin
      .from('webhook_config')
      .select('id')
      .limit(1)
      .single()

    let data, error

    if (existingConfig) {
      // Update existing config
      const result = await admin
        .from('webhook_config')
        .update({
          webhook_url: webhookUrl,
          secret: secret,
          enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConfig.id)
        .select(`
          id,
          webhook_url,
          secret,
          enabled,
          created_at,
          updated_at,
          created_by,
          profiles!webhook_config_created_by_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .single()
      
      data = result.data
      error = result.error
    } else {
      // Create new config
      const result = await admin
        .from('webhook_config')
        .insert({
          webhook_url: webhookUrl,
          secret: secret,
          enabled: enabled,
          created_by: authResult.userId
        })
        .select(`
          id,
          webhook_url,
          secret,
          enabled,
          created_at,
          updated_at,
          created_by,
          profiles!webhook_config_created_by_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .single()
      
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error saving webhook config:', error)
      return NextResponse.json({ error: "Failed to save webhook config" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      webhookConfig: data,
      message: existingConfig ? "Webhook configuration updated successfully" : "Webhook configuration created successfully"
    })
  } catch (error) {
    console.error("Error in webhook config POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const admin = createAdminClient()

    const { error } = await admin
      .from('webhook_config')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (error) {
      console.error('Error deleting webhook config:', error)
      return NextResponse.json({ error: "Failed to delete webhook config" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Webhook configuration deleted successfully"
    })
  } catch (error) {
    console.error("Error in webhook config DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
