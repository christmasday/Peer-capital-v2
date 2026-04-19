import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth, createAdminResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const VALID_STATUSES = ["open", "in_progress", "resolved", "closed"] as const
const VALID_PRIORITIES = ["low", "medium", "high", "urgent"] as const

type ValidStatus = (typeof VALID_STATUSES)[number]
type ValidPriority = (typeof VALID_PRIORITIES)[number]

function formatDisplayName(profile: {
  first_name: string | null
  last_name: string | null
  email: string | null
  id: string
}) {
  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
  return fullName || profile.email || profile.id
}

function applyCaseFilters(
  query: ReturnType<ReturnType<typeof createAdminClient>["from"]>,
  filters: {
    search: string
    status: string
    priority: string
    category: string
    assignedTo: string
  },
  includeStatusFilter = true
) {
  let nextQuery = query

  if (filters.search) {
    nextQuery = nextQuery.or(
      `subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    )
  }

  if (includeStatusFilter && filters.status !== "all" && VALID_STATUSES.includes(filters.status as ValidStatus)) {
    nextQuery = nextQuery.eq("status", filters.status)
  }

  if (filters.priority !== "all" && VALID_PRIORITIES.includes(filters.priority as ValidPriority)) {
    nextQuery = nextQuery.eq("priority", filters.priority)
  }

  if (filters.category !== "all") {
    nextQuery = nextQuery.eq("category", filters.category)
  }

  if (filters.assignedTo === "unassigned") {
    nextQuery = nextQuery.is("assigned_to", null)
  } else if (filters.assignedTo !== "all") {
    nextQuery = nextQuery.eq("assigned_to", filters.assignedTo)
  }

  return nextQuery
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const search = (searchParams.get("search") || "").trim()
    const status = (searchParams.get("status") || "all").trim()
    const priority = (searchParams.get("priority") || "all").trim()
    const category = (searchParams.get("category") || "all").trim()
    const assignedTo = (searchParams.get("assignedTo") || "all").trim()

    const admin = createAdminClient()
    const offset = (Math.max(page, 1) - 1) * Math.max(limit, 1)

    const filters = {
      search,
      status,
      priority,
      category,
      assignedTo,
    }

    const query = applyCaseFilters(
      admin.from("support_tickets").select("*", { count: "exact" }),
      filters,
      true
    )

    const { data: tickets, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + Math.max(limit, 1) - 1)

    if (error) {
      console.error("Error fetching support cases:", error)
      return NextResponse.json({ error: "Failed to fetch support cases" }, { status: 500 })
    }

    const ticketRows = tickets || []

    const profileIds = Array.from(
      new Set(
        ticketRows
          .flatMap((ticket) => [ticket.user_id, ticket.assigned_to])
          .filter((id): id is string => Boolean(id))
      )
    )

    const { data: profiles } = profileIds.length
      ? await admin
          .from("profiles")
          .select("id, email, first_name, last_name")
          .in("id", profileIds)
      : { data: [] }

    const profileById = new Map(
      (profiles || []).map((profile) => [profile.id, profile])
    )

    const { data: staffRoles } = await admin
      .from("user_roles")
      .select("user_id")
      .in("role_type", ["admin", "support"])

    const staffIds = Array.from(new Set((staffRoles || []).map((role) => role.user_id)))

    const { data: staffProfiles } = staffIds.length
      ? await admin
          .from("profiles")
          .select("id, email, first_name, last_name")
          .in("id", staffIds)
      : { data: [] }

    const enrichedTickets = ticketRows.map((ticket) => {
      const reporterProfile = ticket.user_id ? profileById.get(ticket.user_id) : null
      const assigneeProfile = ticket.assigned_to ? profileById.get(ticket.assigned_to) : null

      return {
        ...ticket,
        reporter: reporterProfile
          ? {
              id: reporterProfile.id,
              email: reporterProfile.email,
              name: formatDisplayName(reporterProfile),
            }
          : null,
        assignee: assigneeProfile
          ? {
              id: assigneeProfile.id,
              email: assigneeProfile.email,
              name: formatDisplayName(assigneeProfile),
            }
          : null,
      }
    })

    const summaryCountRequests = VALID_STATUSES.map(async (statusValue) => {
      const statusCountQuery = applyCaseFilters(
        admin
          .from("support_tickets")
          .select("id", { count: "exact", head: true })
          .eq("status", statusValue),
        filters,
        false
      )
      const { count: statusCount } = await statusCountQuery
      return { status: statusValue, count: statusCount || 0 }
    })

    const summaryCounts = await Promise.all(summaryCountRequests)
    const summary = {
      total: count || 0,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    }

    for (const item of summaryCounts) {
      ;(summary as Record<string, number>)[item.status] = item.count
    }

    return NextResponse.json({
      success: true,
      cases: enrichedTickets,
      summary,
      staffMembers: (staffProfiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email,
        name: formatDisplayName(profile),
      })),
      pagination: {
        page: Math.max(page, 1),
        limit: Math.max(limit, 1),
        total: count || 0,
        pages: Math.ceil((count || 0) / Math.max(limit, 1)),
      },
    })
  } catch (error) {
    console.error("Error in admin cases GET:", error)
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
    const caseId = body?.caseId as string | undefined

    if (!caseId) {
      return NextResponse.json({ error: "caseId is required" }, { status: 400 })
    }

    const updateData: {
      status?: ValidStatus
      priority?: ValidPriority
      assigned_to?: string | null
      resolved_at?: string | null
      updated_at: string
    } = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.status === "string") {
      if (!VALID_STATUSES.includes(body.status as ValidStatus)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      updateData.status = body.status as ValidStatus
      updateData.resolved_at = body.status === "resolved" ? new Date().toISOString() : null
    }

    if (typeof body.priority === "string") {
      if (!VALID_PRIORITIES.includes(body.priority as ValidPriority)) {
        return NextResponse.json({ error: "Invalid priority" }, { status: 400 })
      }
      updateData.priority = body.priority as ValidPriority
    }

    if (body.assignedTo !== undefined) {
      updateData.assigned_to = body.assignedTo || null
    }

    if (!updateData.status && !updateData.priority && body.assignedTo === undefined) {
      return NextResponse.json({ error: "No valid update fields provided" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: updatedCase, error } = await admin
      .from("support_tickets")
      .update(updateData)
      .eq("id", caseId)
      .select("*")
      .single()

    if (error) {
      console.error("Error updating support case:", error)
      return NextResponse.json({ error: "Failed to update support case" }, { status: 500 })
    }

    return NextResponse.json({ success: true, case: updatedCase })
  } catch (error) {
    console.error("Error in admin cases PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
