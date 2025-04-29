import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectionsList } from "@/components/profile/connections-list"
import { getFollowersCount, getFollowingCount } from "@/lib/actions/connections"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function UserConnectionsPage({
  params,
  searchParams,
}: {
  params: { userId: string }
  searchParams: { tab?: string }
}) {
  const { userId } = params
  const activeTab = searchParams.tab || "followers"

  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const adminClient = createAdminClient()

  // Get user profile
  const { data: profile, error } = await adminClient.from("profiles").select("*").eq("id", userId).single()

  if (error || !profile) {
    console.error("Error fetching user profile:", error)
    notFound()
  }

  // Get followers and following counts
  const followersResult = await getFollowersCount(userId)
  const followingResult = await getFollowingCount(userId)
  const followersCount = followersResult.count || 0
  const followingCount = followingResult.count || 0

  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User"

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Link href={`/profile/${userId}`} className="flex items-center text-blue-600 hover:underline">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to {fullName}'s Profile
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{fullName}'s Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectionsList
            userId={userId}
            initialFollowersCount={followersCount}
            initialFollowingCount={followingCount}
          />
        </CardContent>
      </Card>
    </div>
  )
}
