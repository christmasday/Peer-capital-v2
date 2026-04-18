import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const admin = createAdminClient()

    // Delete sessions whose user_id is not present in public.auth_users
    const { error } = await admin.rpc("exec_sql", {
      sql: `
        DELETE FROM user_sessions us
        WHERE NOT EXISTS (
          SELECT 1 FROM auth_users au WHERE au.id = us.user_id
        );
      `
    })

    if (error) {
      // Fallback path for environments without SQL RPC support.
      const { data: validUsers, error: validUsersError } = await admin
        .from("auth_users")
        .select("id")

      if (validUsersError) {
        return NextResponse.json({ error: "Failed to cleanup sessions" }, { status: 500 })
      }

      const validUserIds = (validUsers || []).map((user) => user.id)
      const { data: allSessions, error: sessionsError } = await admin
        .from("user_sessions")
        .select("id,user_id")

      if (sessionsError) {
        return NextResponse.json({ error: "Failed to cleanup sessions" }, { status: 500 })
      }

      const validUserSet = new Set(validUserIds)
      const orphanSessionIds = (allSessions || [])
        .filter((session) => !validUserSet.has(session.user_id))
        .map((session) => session.id)

      if (orphanSessionIds.length > 0) {
        const { error: fallbackErr } = await admin
          .from("user_sessions")
          .delete()
          .in("id", orphanSessionIds)

        if (fallbackErr) {
          return NextResponse.json({ error: "Failed to cleanup sessions" }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}


