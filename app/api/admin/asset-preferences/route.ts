import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth, createAdminResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const admin = createAdminClient()

    if (userId) {
      // Get preferences for specific user
      const { data: preferences, error } = await admin
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          asset_preferences
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user asset preferences:', error)
        return NextResponse.json({ error: "Failed to fetch user preferences" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        preferences: preferences || null
      })
    } else {
      // Get all users with their preferences
      const { data: users, error } = await admin
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          asset_preferences,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users asset preferences:', error)
        return NextResponse.json({ error: "Failed to fetch users preferences" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        users: users || []
      })
    }
  } catch (error) {
    console.error("Error in asset preferences GET:", error)
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
    const { userId, preferences } = body

    if (!userId || !preferences) {
      return NextResponse.json({ error: "userId and preferences are required" }, { status: 400 })
    }

    // Validate preferences structure
    const validAssets = ['USDC', 'USDT', 'NGN', 'BTC', 'ETH']
    if (preferences.defaultAsset && !validAssets.includes(preferences.defaultAsset)) {
      return NextResponse.json({ error: "Invalid default asset" }, { status: 400 })
    }

    if (preferences.slippageTolerance && (preferences.slippageTolerance < 0 || preferences.slippageTolerance > 100)) {
      return NextResponse.json({ error: "Slippage tolerance must be between 0 and 100" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('profiles')
      .update({
        asset_preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select(`
        id,
        first_name,
        last_name,
        email,
        asset_preferences,
        updated_at
      `)
      .single()

    if (error) {
      console.error('Error updating asset preferences:', error)
      return NextResponse.json({ error: "Failed to update asset preferences" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: data,
      message: "Asset preferences updated successfully"
    })
  } catch (error) {
    console.error("Error in asset preferences POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
