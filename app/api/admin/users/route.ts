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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const admin = createAdminClient()
    const offset = (page - 1) * limit

    // Build query
    let query = admin
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone_number,
        created_at,
        updated_at,
        is_staff,
        bvn_verified,
        sr_user_id
      `, { count: 'exact' })

    // Add search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
    }

    // Add status filter
    if (status) {
      if (status === 'staff') {
        query = query.eq('is_staff', true)
      } else if (status === 'verified') {
        query = query.eq('bvn_verified', true)
      } else if (status === 'unverified') {
        query = query.eq('bvn_verified', false)
      }
    }

    // Add pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: users, error, count } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error("Error in users GET:", error)
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
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action are required" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Prevent admin from modifying their own account
    if (userId === authResult.userId) {
      return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 })
    }

    let updateData: any = {}

    switch (action) {
      case 'suspend':
        updateData = { suspended: true, suspended_at: new Date().toISOString() }
        break
      case 'unsuspend':
        updateData = { suspended: false, suspended_at: null }
        break
      case 'disable':
        updateData = { disabled: true, disabled_at: new Date().toISOString() }
        break
      case 'enable':
        updateData = { disabled: false, disabled_at: null }
        break
      case 'make_staff':
        updateData = { is_staff: true }
        break
      case 'remove_staff':
        updateData = { is_staff: false }
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await admin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: data,
      message: `User ${action} successful`
    })
  } catch (error) {
    console.error("Error in users PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
