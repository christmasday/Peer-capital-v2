import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserId } from "@/lib/auth-utils"
import { isStaffMember } from "@/lib/role-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> | { ticketId: string } }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const ticketId = resolvedParams?.ticketId || request.nextUrl.pathname.split("/").pop() || ""

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket id is required" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const isStaff = await isStaffMember(userId)

    const { data: ticket, error: ticketError } = await adminClient
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const isOwner = ticket.user_id === userId
    if (!isStaff && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: responses, error: responsesError } = await adminClient
      .from("support_ticket_responses")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })

    if (responsesError) {
      console.error("Error fetching support ticket responses:", responsesError)
      return NextResponse.json({ error: "Failed to fetch ticket responses" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ticket,
      responses: responses || [],
      isStaff,
      currentUserId: userId,
    })
  } catch (error) {
    console.error("Error in support ticket details API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
