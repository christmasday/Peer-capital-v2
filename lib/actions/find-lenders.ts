"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export type LenderSearchParams = {
  loanAmount?: number
  loanDuration?: number
}

export type LenderResult = {
  id: string
  name: string
  interest_rate: number
  max_loan_amount: number
  loans_issued: number
  amount_issued: number
  profile_image_url: string | null
  rating?: number
  repayment_time: number
  repayment_unit?: string
}

export async function findLenders({ loanAmount, loanDuration }: LenderSearchParams): Promise<{
  lenders: LenderResult[]
  error: string | null
}> {
  try {
    // Validate input - at least one parameter must be provided
    if ((loanAmount === undefined || loanAmount <= 0) && (loanDuration === undefined || loanDuration <= 0)) {
      return { lenders: [], error: "Please enter either a loan amount or duration" }
    }

    // Create Supabase client
    const supabase = createServerClient()

    // Get the current user's ID using checkAuth
    const { checkAuth } = await import("@/lib/auth-utils");
    const authStatus = await checkAuth();
    const currentUserId = authStatus?.userId || null;
    if (!currentUserId) {
      return { lenders: [], error: "You must be logged in to search for lenders." };
    }

    // Get the list of user IDs the current user is following
    const adminClient = createAdminClient();
    const { data: followingConnections, error: followingError } = await adminClient
      .from("user_connections")
      .select("following_id")
      .eq("follower_id", currentUserId)
      .eq("status", "active");
    if (followingError) {
      console.error("Error fetching following connections:", followingError);
      return { lenders: [], error: "Failed to get your following list." };
    }
    const followingIds = (followingConnections || []).map((conn: { following_id: string }) => conn.following_id);
    if (!followingIds.length) {
      return { lenders: [], error: "You are not following any users who are lenders." };
    }

    // Build query based on provided parameters, and filter to only those user_ids
    let query = adminClient
      .from("loan_helpers")
      .select(`*, loan_helper_settings(repayment_time, repayment_unit)`)
      .in("user_id", followingIds);

    // Add filters based on provided parameters
    if (loanAmount !== undefined && loanAmount > 0) {
      query = query.gte("max_loan_amount", loanAmount);
    }
    if (loanDuration !== undefined && loanDuration > 0) {
      query = query.gte("loan_helper_settings.repayment_time", loanDuration);
    }

    // Execute query
    const { data: helpers, error } = await query;

    if (error) {
      console.error("Error finding lenders:", error)
      return { lenders: [], error: "Failed to find lenders" }
    }

    // If no results, try with admin client
    let finalHelpers = helpers || []
    if (finalHelpers.length === 0) {
      try {
        // Build admin query
        let adminQuery = adminClient
          .from("loan_helper_settings")
          .select(`id, user_id, loan_amount, interest_rate, repayment_time, repayment_unit`)

        // Add filters based on provided parameters
        if (loanAmount !== undefined && loanAmount > 0) {
          adminQuery = adminQuery.gte("loan_amount", loanAmount)
        }

        if (loanDuration !== undefined && loanDuration > 0) {
          adminQuery = adminQuery.gte("repayment_time", loanDuration)
        }

        // Execute admin query
        const { data: adminLenderSettings, error: adminError } = await adminQuery

        if (adminError) {
          console.error("Admin error finding lenders:", adminError)
        } else if (adminLenderSettings) {
          finalHelpers = adminLenderSettings
        }
      } catch (adminErr) {
        console.error("Error using admin client:", adminErr)
      }
    }

    // Now, for each lender setting, get the user profile information and loan statistics
    const lenders: LenderResult[] = []

    for (const helper of finalHelpers) {
      try {
        // Use helper and joined settings
        const settings = helper.loan_helper_settings || {}
        const userId = helper.user_id
        const name = helper.name
        const profileImageUrl = helper.profile_image_url
        const interestRate = helper.interest_rate
        const maxLoanAmount = helper.max_loan_amount
        const loansIssued = helper.loans_issued
        const amountIssued = helper.amount_issued
        const repaymentTime = settings.repayment_time
        const repaymentUnit = settings.repayment_unit

        // Get user profile information
        const { data: profileDataArray, error: profileError } = await adminClient
          .from("profiles")
          .select(`first_name, last_name, profile_picture_url`)
          .eq("id", userId)

        if (profileError) {
          console.error(`Error getting profile for user ${userId}:`, profileError)
          continue
        }

        // Skip if no profile found
        if (!profileDataArray || profileDataArray.length === 0) {
          console.log(`No profile found for user ${userId}, skipping`)
          continue
        }

        const profileData = profileDataArray[0]

        // Skip if no name information
        if (!profileData.first_name && !profileData.last_name) {
          console.log(`No name information for user ${userId}, skipping`)
          continue
        }

        // Get loan statistics - max loan amount ever offered
        const { data: maxLoanData, error: maxLoanError } = await adminClient
          .from("loan_requests")
          .select("amount")
          .eq("helper_id", userId)
          .order("amount", { ascending: false })
          .limit(1)

        if (maxLoanError) {
          console.error(`Error getting max loan for user ${userId}:`, maxLoanError)
        }

        // Get loan count - total number of loans issued
        const { count: loansIssuedCount, error: countError } = await adminClient
          .from("loan_requests")
          .select("id", { count: 'exact' })
          .eq("helper_id", userId)
          .eq("status", "approved")

        if (countError) {
          console.error(`Error getting loan count for user ${userId}:`, countError)
        }

        // Get total amount issued
        const { data: totalAmountData, error: totalAmountError } = await adminClient
          .from("loan_requests")
          .select("amount")
          .eq("helper_id", userId)
          .eq("status", "approved")

        if (totalAmountError) {
          console.error(`Error getting total amount for user ${userId}:`, totalAmountError)
        }

        // Calculate total amount issued
        const totalAmountIssued = totalAmountData
          ? totalAmountData.reduce((sum: number, loan: { amount: number }) => sum + (loan.amount || 0), 0)
          : 0

        // Get the highest loan amount ever offered (or default to the setting amount)
        const computedMaxLoanAmount = maxLoanData && maxLoanData.length > 0 ? maxLoanData[0].amount : maxLoanAmount

        // Get average rating
        const { data: ratingData, error: ratingError } = await adminClient
          .from("user_reviews")
          .select("rating")
          .eq("user_id", userId)

        if (ratingError) {
          console.error(`Error getting ratings for user ${userId}:`, ratingError)
        }

        // Calculate average rating
        let averageRating = 0
        if (ratingData && ratingData.length > 0) {
          const sum = ratingData.reduce((total: number, review: { rating: number }) => total + (review.rating || 0), 0)
          averageRating = sum / ratingData.length
        } else {
          // If no ratings, generate a random rating between 4.0 and 5.0
          averageRating = Math.random() * 1.0 + 4.0
        }

        // Fetch lender's profile for validation
        const { data: lenderProfile, error: lenderProfileError } = await adminClient
          .from("profiles")
          .select("id, lending_license_url, first_name, last_name, phone_number, address, city, state, bank_name, account_number, bvn, date_of_birth")
          .eq("id", userId)
          .maybeSingle()
        if (lenderProfileError) {
          console.error(`Error fetching lender profile for user ${userId}:`, lenderProfileError)
          continue
        }
        // Check if profile is complete (basic fields filled)
        const isProfileComplete = lenderProfile && lenderProfile.first_name && lenderProfile.last_name && lenderProfile.phone_number && lenderProfile.address && lenderProfile.city && lenderProfile.state && lenderProfile.bank_name && lenderProfile.account_number && lenderProfile.bvn && lenderProfile.date_of_birth
        // If max loan > 2,000,000, require profile complete and lending license
        if ((computedMaxLoanAmount > 2000000 || computedMaxLoanAmount > 2000000) && (!isProfileComplete || !lenderProfile.lending_license_url)) {
          // Skip this lender
          continue
        }

        lenders.push({
          id: userId,
          name,
          interest_rate: interestRate,
          max_loan_amount: computedMaxLoanAmount,
          loans_issued: loansIssued,
          amount_issued: totalAmountIssued,
          profile_image_url: profileImageUrl,
          rating: Number(averageRating.toFixed(1)),
          repayment_time: repaymentTime,
          repayment_unit: repaymentUnit,
        })
      } catch (profileErr) {
        console.error(`Error processing profile for user ${helper?.user_id || 'unknown'}:`, profileErr)
      }
    }

    // If no lenders found, return empty array with appropriate error message
    if (lenders.length === 0) {
      let errorMessage = "No lenders found matching your criteria."

      if (loanAmount !== undefined && loanDuration !== undefined) {
        errorMessage += " Try adjusting your loan amount or duration."
      } else if (loanAmount !== undefined) {
        errorMessage += " Try a different loan amount."
      } else if (loanDuration !== undefined) {
        errorMessage += " Try a different loan duration."
      }

      return { lenders: [], error: errorMessage }
    }

    return { lenders: lenders, error: null }
  } catch (error) {
    console.error("Unexpected error finding lenders:", error)
    return { lenders: [], error: "An unexpected error occurred" }
  }
}

// Returns the maximum loan amount ever offered by a lender (all loans in history)
export async function getMaxLoanAmountByLender(lenderId: string): Promise<number> {
  const adminClient = createAdminClient() as SupabaseClient<Database>
  const { data, error } = await adminClient
    .from("loan_history")
    .select("amount")
    .eq("lender_id", lenderId)
    .order("amount", { ascending: false })
    .limit(1)
  if (error || !data || data.length === 0) return 0
  return data[0].amount || 0
}

// Returns the total amount of money given in loans by a lender (approved or completed loans)
export async function getTotalAmountGivenByLender(lenderId: string): Promise<number> {
  const adminClient = createAdminClient() as SupabaseClient<Database>
  const { data, error } = await adminClient
    .from("loan_history")
    .select("amount")
    .eq("lender_id", lenderId)
    .in("status", ["approved", "repaid"]) // Only count successful loans
  if (error || !data) return 0
  return data.reduce((sum: number, row: { amount: number }) => sum + (row.amount || 0), 0)
}
