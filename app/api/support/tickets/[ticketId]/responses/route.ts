import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserId } from "@/lib/auth-utils"
import { isStaffMember } from "@/lib/role-utils"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> | { ticketId: string } }
) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const ticketId = resolvedParams?.ticketId || request.nextUrl.pathname.split("/").slice(-2)[0] || ""

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket id is required" }, { status: 400 })
    }

    const { message } = await request.json()
    const trimmedMessage = String(message || "").trim()

    if (!trimmedMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const isStaff = await isStaffMember(userId)

    const { data: ticket, error: ticketError } = await adminClient
      .from("support_tickets")
      .select("id, user_id")
      .eq("id", ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const isOwner = ticket.user_id === userId
    if (!isStaff && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: createdResponse, error: insertError } = await adminClient
      .from("support_ticket_responses")
      .insert({
        ticket_id: ticketId,
        user_id: userId,
        is_staff_response: isStaff,
        message: trimmedMessage,
      })
      .select("*")
      .single()

    if (insertError || !createdResponse) {
      console.error("Error creating support ticket response:", insertError)
      return NextResponse.json({ error: "Failed to create response" }, { status: 500 })
    }

    const ticketUpdateData: { updated_at: string; status?: string } = {
      updated_at: new Date().toISOString(),
    }

    if (!isStaff) {
      ticketUpdateData.status = "open"
    }

    const { error: ticketUpdateError } = await adminClient
      .from("support_tickets")
      .update(ticketUpdateData)
      .eq("id", ticketId)

    if (ticketUpdateError) {
      console.error("Failed to update support ticket after response:", ticketUpdateError)
    }

    return NextResponse.json({
      success: true,
      response: createdResponse,
    })
  } catch (error) {
    console.error("Error in support ticket response API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
