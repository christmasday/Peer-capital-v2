import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import LenderReviewsSection from "@/components/lenders/lender-reviews-section"

export default async function UserReviewsPage({ params }: { params: { userId: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // Check if user exists
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, first_name, last_name")
    .eq("id", params.userId)
    .single()

  if (error || !profile) {
    notFound()
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Reviews for {profile.username ? `@${profile.username}` : `${profile.first_name} ${profile.last_name}`}
      </h1>

      <Card>
        <CardContent className="p-6">
          <LenderReviewsSection lenderId={params.userId} />
        </CardContent>
      </Card>
    </div>
  )
}
