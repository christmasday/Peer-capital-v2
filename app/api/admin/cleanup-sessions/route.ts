import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const admin = createAdminClient()

    // Delete sessions whose user_id is not present in auth.users
    const { error } = await admin.rpc("exec_sql", {
      sql: `
        DELETE FROM user_sessions us
        WHERE NOT EXISTS (
          SELECT 1 FROM auth.users au WHERE au.id = us.user_id
        );
      `
    })

    if (error) {
      // Fallback: attempt delete via join if rpc not available in this env
      const { error: fallbackErr } = await admin
        .from("user_sessions")
        .delete()
        .not("user_id", "in", `(${"SELECT id FROM auth.users"})` as any)
      if (fallbackErr) {
        return NextResponse.json({ error: "Failed to cleanup sessions" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}


