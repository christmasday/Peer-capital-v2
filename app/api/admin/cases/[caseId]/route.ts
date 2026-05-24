import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth, createAdminResponse } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

function formatDisplayName(profile: {
  first_name: string | null
  last_name: string | null
  email: string | null
  id: string
}) {
  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
  return fullName || profile.email || profile.id
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> | { caseId: string } }
) {
  try {
    const authResult = await checkAdminAuth()
    if (!authResult.authenticated) {
      return createAdminResponse(authResult.error || "Unauthorized")
    }

    const resolvedParams = await Promise.resolve(params)
    const caseId = resolvedParams?.caseId || req.nextUrl.pathname.split("/").pop() || ""

    if (!caseId) {
      return NextResponse.json({ error: "Case id is required" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: supportCase, error: caseError } = await admin
      .from("support_tickets")
      .select("*")
      .eq("id", caseId)
      .single()

    if (caseError || !supportCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 })
    }

    const relatedProfileIds = [supportCase.user_id, supportCase.assigned_to].filter(
      (id): id is string => Boolean(id)
    )

    const { data: profiles } = relatedProfileIds.length
      ? await admin
          .from("profiles")
          .select("id, email, first_name, last_name")
          .in("id", relatedProfileIds)
      : { data: [] }

    const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]))

    const { data: responses, error: responsesError } = await admin
      .from("support_ticket_responses")
      .select("*")
      .eq("ticket_id", caseId)
      .order("created_at", { ascending: true })

    if (responsesError) {
      console.error("Error fetching case responses:", responsesError)
      return NextResponse.json({ error: "Failed to fetch case responses" }, { status: 500 })
    }

    const responseUserIds = Array.from(
      new Set(
        (responses || [])
          .map((response) => response.user_id)
          .filter((id): id is string => Boolean(id))
      )
    )

    const missingProfileIds = responseUserIds.filter((id) => !profileById.has(id))

    if (missingProfileIds.length) {
      const { data: extraProfiles } = await admin
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("id", missingProfileIds)

      for (const profile of extraProfiles || []) {
        profileById.set(profile.id, profile)
      }
    }

    const enrichedResponses = (responses || []).map((response) => {
      const profile = response.user_id ? profileById.get(response.user_id) : null
      return {
        ...response,
        author: profile
          ? {
              id: profile.id,
              email: profile.email,
              name: formatDisplayName(profile),
            }
          : null,
      }
    })

    return NextResponse.json({
      success: true,
      case: {
        ...supportCase,
        reporter: supportCase.user_id
          ? (() => {
              const profile = profileById.get(supportCase.user_id)
              if (!profile) return null
              return {
                id: profile.id,
                email: profile.email,
                name: formatDisplayName(profile),
              }
            })()
          : null,
        assignee: supportCase.assigned_to
          ? (() => {
              const profile = profileById.get(supportCase.assigned_to)
              if (!profile) return null
              return {
                id: profile.id,
                email: profile.email,
                name: formatDisplayName(profile),
              }
            })()
          : null,
      },
      responses: enrichedResponses,
    })
  } catch (error) {
    console.error("Error in admin case details GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
