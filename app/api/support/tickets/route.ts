import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { getCurrentUserId } from "@/lib/auth-utils"
import { isStaffMember } from "@/lib/role-utils"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()

    // Check if user is staff
    const isStaff = await isStaffMember(userId)

    let ticketsQuery
    if (isStaff) {
      // Staff can see all tickets
      ticketsQuery = adminClient
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
    } else {
      // Regular users can only see their own tickets
      ticketsQuery = adminClient
        .from("support_tickets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
    }

    const { data: tickets, error } = await ticketsQuery

    if (error) {
      console.error("Error fetching support tickets:", error)
      return NextResponse.json(
        { error: "Failed to fetch support tickets" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tickets: tickets || [],
      isStaff: isStaff
    })

  } catch (error) {
    console.error("Error in support tickets API:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
