import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth, createAdminResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const VALID_STATUSES = ["open", "in_progress", "resolved", "closed"] as const

type ValidStatus = (typeof VALID_STATUSES)[number]

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> | { caseId: string } }
) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated || !authResult.userId) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const body = await req.json()
    const message = (body?.message || "").trim()
    const status = body?.status as string | undefined

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 })
    }

    if (status && !VALID_STATUSES.includes(status as ValidStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const resolvedParams = await Promise.resolve(params)
    const caseId = resolvedParams?.caseId || req.nextUrl.pathname.split("/").slice(-2)[0] || ""

    if (!caseId) {
      return NextResponse.json({ error: "Case id is required" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: supportCase, error: caseError } = await admin
      .from("support_tickets")
      .select("id, status")
      .eq("id", caseId)
      .single()

    if (caseError || !supportCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    const { data: createdResponse, error: responseError } = await admin
      .from("support_ticket_responses")
      .insert({
        ticket_id: caseId,
        user_id: authResult.userId,
        is_staff_response: true,
        message,
      })
      .select("*")
      .single()

    if (responseError) {
      console.error("Error creating case response:", responseError)
      return NextResponse.json({ error: "Failed to add response" }, { status: 500 })
    }

    if (status) {
      const updateData: {
        status: ValidStatus
        resolved_at?: string | null
        updated_at: string
      } = {
        status: status as ValidStatus,
        updated_at: new Date().toISOString(),
      }

      updateData.resolved_at = status === "resolved" ? new Date().toISOString() : null

      const { error: statusError } = await admin
        .from("support_tickets")
        .update(updateData)
        .eq("id", caseId)

      if (statusError) {
        console.error("Error updating case status after response:", statusError)
      }
    }

    return NextResponse.json({
      success: true,
      response: createdResponse,
      message: "Case response added successfully",
    })
  } catch (error) {
    console.error("Error in admin case response POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
