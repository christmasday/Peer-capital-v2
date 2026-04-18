import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserId } from "@/lib/auth-utils"
import { isStaffMember } from "@/lib/role-utils"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { ticketId } = params
    const { status } = await request.json()

    // Validate status
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: open, in_progress, resolved, closed" },
        { status: 400 }
      )
    }

    // Check authentication
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()

    // Get the ticket to check ownership
    const { data: ticket, error: fetchError } = await adminClient
      .from("support_tickets")
      .select("user_id, status")
      .eq("id", ticketId)
      .single()

    if (fetchError || !ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      )
    }

    // Check if user is staff or ticket owner
    const isStaff = await isStaffMember(userId)
    const isOwner = ticket.user_id === userId

    if (!isStaff && !isOwner) {
      return NextResponse.json(
        { error: "Unauthorized to update this ticket" },
        { status: 403 }
      )
    }

    // Only staff can change status to 'closed' or 'resolved'
    if ((status === 'closed' || status === 'resolved') && !isStaff) {
      return NextResponse.json(
        { error: "Only staff members can close or resolve tickets" },
        { status: 403 }
      )
    }

    // Update the ticket status
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    }

    // Set resolved_at timestamp if status is 'resolved'
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { error: updateError } = await adminClient
      .from("support_tickets")
      .update(updateData)
      .eq("id", ticketId)

    if (updateError) {
      console.error("Error updating ticket status:", updateError)
      return NextResponse.json(
        { error: "Failed to update ticket status" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Ticket status updated successfully"
    })

  } catch (error) {
    console.error("Error in ticket status update:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
