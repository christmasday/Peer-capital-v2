import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"

export interface AdminAuthResult {
  authenticated: boolean
  userId?: string
  isAdmin?: boolean
  error?: string
}

export async function checkAdminAuth(): Promise<AdminAuthResult> {
  try {
    // First check if user is authenticated
    const authResult = await checkAuth()
    if (!authResult.authenticated || !authResult.userId) {
      return { authenticated: false, error: "Not authenticated" }
    }

    // Check if user is admin (has is_staff flag)
    const admin = createAdminClient()
    const { data: profile, error } = await admin
      .from('profiles')
      .select('is_staff')
      .eq('id', authResult.userId)
      .single()

    if (error || !profile) {
      return { authenticated: false, error: "Profile not found" }
    }

    if (!profile.is_staff) {
      return { authenticated: false, error: "Admin access required" }
    }

    return {
      authenticated: true,
      userId: authResult.userId,
      isAdmin: true
    }
  } catch (error) {
    console.error("Admin auth check error:", error)
    return { authenticated: false, error: "Authentication error" }
  }
}

export function createAdminResponse(error: string, status: number = 401) {
  return NextResponse.json({ error }, { status })
}
