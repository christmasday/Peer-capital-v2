import { createAdminClient } from "@/lib/supabase/admin"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { AdminLoanRequestsDashboard } from "@/components/admin/admin-loan-requests-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminLoanRequestsPage() {
  const adminClient = createAdminClient() as SupabaseClient<Database>

  const { data: loanRequests, error } = await adminClient
    .from("loan_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load loan requests: {error.message}</p>
      </div>
    )
  }

  // Collect all unique user IDs (borrowers + helpers)
  const allUserIds = Array.from(
    new Set(
      (loanRequests || []).flatMap((r: any) => [r.user_id, r.helper_id].filter(Boolean))
    )
  )

  let profilesMap: Record<string, any> = {}
  if (allUserIds.length > 0) {
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, username, first_name, last_name, profile_picture_url")
      .in("id", allUserIds)
    if (profiles) {
      profilesMap = profiles.reduce((acc: Record<string, any>, p: any) => {
        acc[p.id] = p
        return acc
      }, {})
    }
  }

  const enriched = (loanRequests || []).map((r: any) => ({
    ...r,
    borrower: profilesMap[r.user_id] || null,
    helper: profilesMap[r.helper_id] || null,
  }))

  return <AdminLoanRequestsDashboard loanRequests={enriched} />
}
