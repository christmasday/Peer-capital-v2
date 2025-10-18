import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth, createAdminResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { createStablesrailClient, StablesrailError } from "@/lib/stablesrail/client"
import crypto from "crypto"

export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const admin = createAdminClient()

    const { data: apiKeys, error } = await admin
      .from('api_keys')
      .select(`
        id,
        key_preview,
        name,
        description,
        created_at,
        last_rotated_at,
        expires_at,
        is_active,
        created_by,
        profiles!api_keys_created_by_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      apiKeys: apiKeys || []
    })
  } catch (error) {
    console.error("Error in API keys GET:", error)
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
    const { name, description } = body

    // Generate a new API key
    const apiKey = `key-${crypto.randomBytes(32).toString('hex')}`
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
    const keyPreview = `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 8)}`

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('api_keys')
      .insert({
        key_hash: keyHash,
        key_preview: keyPreview,
        name: name || 'API Key',
        description: description || '',
        created_by: authResult.userId
      })
      .select(`
        id,
        key_preview,
        name,
        description,
        created_at,
        last_rotated_at,
        expires_at,
        is_active,
        created_by,
        profiles!api_keys_created_by_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Error creating API key:', error)
      return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      apiKey: data,
      fullKey: apiKey, // Only returned once during creation
      message: "API key created successfully"
    })
  } catch (error) {
    console.error("Error in API keys POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const body = await req.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ error: "ID and action are required" }, { status: 400 })
    }

    const admin = createAdminClient()

    let updateData: any = {}
    let stablesrailResponse: any = null

    switch (action) {
      case 'regenerate':
        // Call Stablesrail to regenerate API key
        try {
          const stablesrail = createStablesrailClient()
          stablesrailResponse = await stablesrail.regenerateApiKey()
          
          // Extract the new API key from Stablesrail response
          const newApiKey = stablesrailResponse?.apiKey
          
          if (!newApiKey) {
            throw new Error('No API key received from Stablesrail')
          }
          
          // Hash the new API key for storage
          const keyHash = crypto.createHash('sha256').update(newApiKey).digest('hex')
          const keyPreview = `${newApiKey.substring(0, 8)}...${newApiKey.substring(newApiKey.length - 8)}`
          
          updateData = {
            key_hash: keyHash,
            key_preview: keyPreview,
            last_rotated_at: new Date().toISOString()
          }
          
          // Store the full key temporarily for the response
          ;(updateData as any).fullKey = newApiKey
        } catch (stablesrailError) {
          console.error('Stablesrail API key regeneration error:', stablesrailError)
          if (stablesrailError instanceof StablesrailError) {
            return NextResponse.json({ 
              error: `Failed to regenerate API key via Stablesrail: ${stablesrailError.message}`,
              success: false 
            }, { status: 400 })
          }
          return NextResponse.json({ 
            error: "Failed to regenerate API key via Stablesrail",
            success: false 
          }, { status: 500 })
        }
        break
      case 'deactivate':
        updateData = { is_active: false }
        break
      case 'activate':
        updateData = { is_active: true }
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const { data, error } = await admin
      .from('api_keys')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        key_preview,
        name,
        description,
        created_at,
        last_rotated_at,
        expires_at,
        is_active,
        created_by,
        profiles!api_keys_created_by_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Error updating API key:', error)
      return NextResponse.json({ error: "Failed to update API key" }, { status: 500 })
    }

    const response: any = {
      success: true,
      apiKey: data,
      message: `API key ${action} successful`
    }

    // Include the full key only for regeneration
    if (action === 'regenerate') {
      response.fullKey = (updateData as any).fullKey
      response.stablesrailResponse = stablesrailResponse
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in API keys PATCH:", error)
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
      return NextResponse.json({ error: "API key ID is required" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { error } = await admin
      .from('api_keys')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting API key:', error)
      return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "API key deleted successfully"
    })
  } catch (error) {
    console.error("Error in API keys DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
