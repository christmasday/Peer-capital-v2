"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "../supabase/database.types"
import { createNotification } from "./notifications"
import { revalidatePath } from "next/cache"

type LenderReview = {
  id: string
  reviewer_id: string
  lender_id: string
  rating: number
  comment: string
  loan_id?: string | null
  created_at: string
  updated_at: string
  reviewer?: {
    first_name: string | null
    last_name: string | null
    profile_picture_url: string | null
  }
}

export async function submitLenderReview(formData: FormData) {
  const supabase = createServerActionClient<Database>({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "You must be logged in to submit a review" }
  }

  const lenderId = formData.get("lenderId") as string
  const rating = Number.parseInt(formData.get("rating") as string)
  const comment = formData.get("comment") as string
  const loanId = (formData.get("loanId") as string) || null

  if (!lenderId || !rating || !comment) {
    return { error: "Missing required fields" }
  }

  if (rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5" }
  }

  // Check if the user has a loan with this lender
  const { data: loans, error: loansError } = await supabase
    .from("loan_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("helper_id", lenderId)
    .in("status", ["approved", "completed", "active", "repaid"])

  if (loansError) {
    return { error: "Failed to verify loan history" }
  }

  if (!loans || loans.length === 0) {
    return { error: "You can only review lenders you have borrowed from" }
  }

  // Check if the user has already reviewed this lender for this loan
  const { data: existingReview, error: reviewError } = await supabase
    .from("lender_reviews")
    .select("id")
    .eq("reviewer_id", user.id)
    .eq("lender_id", lenderId)
    .eq("loan_id", loanId)
    .maybeSingle()

  if (reviewError) {
    return { error: "Failed to check existing reviews" }
  }

  let result

  if (existingReview) {
    // Update existing review
    result = await supabase
      .from("lender_reviews")
      .update({
        rating,
        comment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingReview.id)
      .select()
  } else {
    // Create new review
    result = await supabase
      .from("lender_reviews")
      .insert({
        reviewer_id: user.id,
        lender_id: lenderId,
        rating,
        comment,
        loan_id: loanId || null,
      })
      .select()
  }

  if (result.error) {
    return { error: "Failed to submit review" }
  }

  // Create notification for the lender
  try {
    // Get reviewer name for notification
    const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single()

    const reviewerName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Someone"

    let notificationMessage
    if (rating >= 4) {
      notificationMessage = `${reviewerName} gave you a ${rating}-star review!`
    } else if (rating === 3) {
      notificationMessage = `${reviewerName} left you a new review`
    } else {
      notificationMessage = `${reviewerName} left you feedback on your lending`
    }

    await createNotification({
      userId: lenderId,
      actorId: user.id,
      type: "review",
      data: {
        rating,
        reviewId: result.data[0].id,
        previewText: comment.substring(0, 50) + (comment.length > 50 ? "..." : ""),
      },
      message: notificationMessage,
    })
  } catch (error) {
    // Don't fail the review submission if notification fails
  }

  revalidatePath(`/profile/${lenderId}`)
  revalidatePath(`/profile/${lenderId}/reviews`)

  return { success: true, data: result.data[0] }
}

export async function getLenderReviews(lenderId: string) {
  const supabase = createServerActionClient<Database>({ cookies })

  const { data, error } = await supabase
    .from("lender_reviews")
    .select(`
      *,
      reviewer:reviewer_id(
        first_name,
        last_name,
        profile_picture_url
      )
    `)
    .eq("lender_id", lenderId)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: "Failed to fetch reviews" }
  }

  return { data: data as LenderReview[] }
}

export async function getUserReviewForLender(lenderId: string) {
  const supabase = createServerActionClient<Database>({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("lender_reviews")
    .select("*")
    .eq("reviewer_id", user.id)
    .eq("lender_id", lenderId)
    .maybeSingle()

  if (error) {
    return { error: "Failed to fetch review" }
  }

  return { data }
}

export async function getUserLoanHistory(lenderId: string) {
  const supabase = createServerActionClient<Database>({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("loan_requests")
    .select("*")
    .eq("user_id", user.id)
    .eq("helper_id", lenderId)
    .in("status", ["approved", "completed", "active", "repaid"])
    .order("created_at", { ascending: false })

  if (error) {
    return { error: "Failed to fetch loan history" }
  }

  return { data }
}
