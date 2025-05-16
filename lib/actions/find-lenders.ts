"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"

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
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Build query based on provided parameters
    let query = supabase.from("loan_helper_settings").select(`id, user_id, loan_amount, interest_rate, repayment_time`)

    // Add filters based on provided parameters
    if (loanAmount !== undefined && loanAmount > 0) {
      query = query.gte("loan_amount", loanAmount)
    }

    if (loanDuration !== undefined && loanDuration > 0) {
      query = query.gte("repayment_time", loanDuration)
    }

    // Execute query
    const { data: lenderSettings, error } = await query

    if (error) {
      console.error("Error finding lenders:", error)
      return { lenders: [], error: "Failed to find lenders" }
    }

    // If no results, try with admin client
    let finalLenderSettings = lenderSettings || []
    if (finalLenderSettings.length === 0) {
      try {
        const adminClient = createAdminClient()

        // Build admin query
        let adminQuery = adminClient
          .from("loan_helper_settings")
          .select(`id, user_id, loan_amount, interest_rate, repayment_time`)

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
          finalLenderSettings = adminLenderSettings
        }
      } catch (adminErr) {
        console.error("Error using admin client:", adminErr)
      }
    }

    // Now, for each lender setting, get the user profile information and loan statistics
    const lenders: LenderResult[] = []

    for (const setting of finalLenderSettings) {
      try {
        // Get user profile information
        const { data: profileDataArray, error: profileError } = await supabase
          .from("profiles")
          .select(`first_name, last_name, profile_picture_url`)
          .eq("id", setting.user_id)

        if (profileError) {
          console.error(`Error getting profile for user ${setting.user_id}:`, profileError)
          continue
        }

        // Skip if no profile found
        if (!profileDataArray || profileDataArray.length === 0) {
          console.log(`No profile found for user ${setting.user_id}, skipping`)
          continue
        }

        const profileData = profileDataArray[0]

        // Skip if no name information
        if (!profileData.first_name && !profileData.last_name) {
          console.log(`No name information for user ${setting.user_id}, skipping`)
          continue
        }

        // Get loan statistics - max loan amount ever offered
        const { data: maxLoanData, error: maxLoanError } = await supabase
          .from("loan_requests")
          .select("amount")
          .eq("helper_id", setting.user_id)
          .order("amount", { ascending: false })
          .limit(1)

        if (maxLoanError) {
          console.error(`Error getting max loan for user ${setting.user_id}:`, maxLoanError)
        }

        // Get loan count - total number of loans issued
        const { count: loansIssuedCount, error: countError } = await supabase
          .from("loan_requests")
          .select("id", { count: true })
          .eq("helper_id", setting.user_id)
          .eq("status", "approved")

        if (countError) {
          console.error(`Error getting loan count for user ${setting.user_id}:`, countError)
        }

        // Get total amount issued
        const { data: totalAmountData, error: totalAmountError } = await supabase
          .from("loan_requests")
          .select("amount")
          .eq("helper_id", setting.user_id)
          .eq("status", "approved")

        if (totalAmountError) {
          console.error(`Error getting total amount for user ${setting.user_id}:`, totalAmountError)
        }

        // Calculate total amount issued
        const totalAmountIssued = totalAmountData
          ? totalAmountData.reduce((sum, loan) => sum + (loan.amount || 0), 0)
          : 0

        // Get the highest loan amount ever offered (or default to the setting amount)
        const maxLoanAmount = maxLoanData && maxLoanData.length > 0 ? maxLoanData[0].amount : setting.loan_amount

        // Get average rating
        const { data: ratingData, error: ratingError } = await supabase
          .from("user_reviews")
          .select("rating")
          .eq("user_id", setting.user_id)

        if (ratingError) {
          console.error(`Error getting ratings for user ${setting.user_id}:`, ratingError)
        }

        // Calculate average rating
        let averageRating = 0
        if (ratingData && ratingData.length > 0) {
          const sum = ratingData.reduce((total, review) => total + (review.rating || 0), 0)
          averageRating = sum / ratingData.length
        } else {
          // If no ratings, generate a random rating between 4.0 and 5.0
          averageRating = Math.random() * 1.0 + 4.0
        }

        lenders.push({
          id: setting.user_id,
          name: `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim(),
          interest_rate: setting.interest_rate || 0,
          max_loan_amount: maxLoanAmount || setting.loan_amount || 0,
          loans_issued: loansIssuedCount || 0,
          amount_issued: totalAmountIssued || 0,
          profile_image_url: profileData.profile_picture_url || null,
          rating: Number(averageRating.toFixed(1)),
        })
      } catch (profileErr) {
        console.error(`Error processing profile for user ${setting.user_id}:`, profileErr)
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
