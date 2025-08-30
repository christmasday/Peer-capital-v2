"use server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { getBlockedUsers } from "@/lib/actions/connections"

export async function submitReview({
  reviewerId,
  userId,
  rating,
  comment,
}: {
  reviewerId: string
  userId: string
  rating: number
  comment: string
}) {
  try {
    const adminClient = createAdminClient()

    // Check if the reviews table exists, if not, this is a placeholder for future implementation
    const { error: tableCheckError } = await adminClient.from("user_reviews").select("id").limit(1)

    if (tableCheckError) {
      // In a real implementation, you would create the table or handle this differently
      return { success: false, message: "Review functionality coming soon" }
    }

    // Insert the review
    const { data, error } = await adminClient.from("user_reviews").insert({
      reviewer_id: reviewerId,
      user_id: userId,
      rating,
      comment,
      created_at: new Date().toISOString(),
    })

    if (error) {
      return { success: false, message: error.message }
    }

    revalidatePath(`/profile/${userId}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function getReviewsForUser(userId: string) {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from("user_reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) {
      return { error: "Failed to fetch reviews" }
    }
    // Filter out reviews from blocked users
    const { blocked } = await getBlockedUsers()
    const filtered = (data || []).filter((review) => !blocked.includes(review.reviewer_id))
    return { data: filtered }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}
