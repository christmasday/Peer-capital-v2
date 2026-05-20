"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export type LoanHelperSettings = {
  id: string
  user_id: string
  loan_amount: number
  interest_rate: number
  repayment_time: number
  repayment_unit?: string // days, weeks, months
  terms_and_conditions: string | null
  created_at: string
  updated_at: string
}

export async function getLoanHelperSettings(
  userId: string,
): Promise<{ data: LoanHelperSettings | null; error: string | null }> {
  try {
    const supabase = await createServerClient() as unknown as SupabaseClient<Database>

    const { data, error } = await supabase.from("loan_helper_settings").select("*").eq("user_id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching loan helper settings:", error)
      return { data: null, error: "Failed to fetch loan helper settings" }
    }

    if (data && !data.repayment_unit) data.repayment_unit = "months"

    return { data: data as LoanHelperSettings, error: null }
  } catch (error) {
    console.error("Unexpected error fetching loan helper settings:", error)
    return { data: null, error: "An unexpected error occurred" }
  }
}

export async function updateLoanHelperSettings(
  userId: string,
  loanAmount: number,
  interestRate: number,
  repaymentTime: number,
  repaymentUnit: string,
  termsAndConditions: string | null,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const adminClient = createAdminClient()

    const { data: existingSettings, error: checkError } = await adminClient
      .from("loan_helper_settings")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing loan helper settings:", checkError)
      return { success: false, error: "Failed to check existing settings" }
    }

    const settingsData = {
      user_id: userId,
      loan_amount: loanAmount,
      interest_rate: interestRate,
      repayment_time: repaymentTime,
      repayment_unit: repaymentUnit,
      terms_and_conditions: termsAndConditions,
      updated_at: new Date().toISOString(),
    }

    if (existingSettings) {
      const { error: updateError } = await adminClient
        .from("loan_helper_settings")
        .update(settingsData)
        .eq("user_id", userId)

      if (updateError) {
        console.error("Error updating loan helper settings:", updateError)
        return { success: false, error: "Failed to update loan helper settings" }
      }

      // Always upsert loan_helpers row with latest values
      const { data: profile } = await adminClient
        .from("profiles")
        .select("first_name, last_name, profile_picture_url")
        .eq("id", userId)
        .maybeSingle()
      const name = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Loan Helper"
      const profileImageUrl = profile ? profile.profile_picture_url : null
      const { error: upsertError } = await adminClient.from("loan_helpers").upsert({
        user_id: userId,
        name,
        interest_rate: interestRate,
        max_loan_amount: loanAmount,
        loans_issued: 0,
        amount_issued: 0,
        profile_image_url: profileImageUrl,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
      if (upsertError) {
        console.error("Error upserting loan_helpers:", upsertError)
        return { success: false, error: "Failed to upsert loan_helpers: " + upsertError.message }
      }
      // Notify all users that this user updated/created loan offers
      try {
        const { createNotificationsForUsers } = await import("@/lib/actions/notifications")
        // Fetch all user ids from profiles
        const { data: allProfiles, error: profilesError } = await adminClient.from("profiles").select("id")
        if (!profilesError && allProfiles && allProfiles.length > 0) {
          const userIds = allProfiles.map((p: any) => p.id)
          await createNotificationsForUsers({
            userIds,
            actorId: userId,
            type: "loan_helper_set",
            data: { userId, loanAmount, repaymentTime, repaymentUnit },
          })
        }
      } catch (notifyErr) {
        console.error("Failed to broadcast loan helper set notification:", notifyErr)
      }
    } else {
      const { error: insertError } = await adminClient.from("loan_helper_settings").insert(settingsData)

      if (insertError) {
        console.error("Error inserting loan helper settings:", insertError)
        return { success: false, error: "Failed to insert loan helper settings" }
      }

      // Always upsert loan_helpers row with latest values
      const { data: profile } = await adminClient
        .from("profiles")
        .select("first_name, last_name, profile_picture_url")
        .eq("id", userId)
        .maybeSingle()
      const name = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Loan Helper"
      const profileImageUrl = profile ? profile.profile_picture_url : null
      const { error: upsertError } = await adminClient.from("loan_helpers").upsert({
        user_id: userId,
        name,
        interest_rate: interestRate,
        max_loan_amount: loanAmount,
        loans_issued: 0,
        amount_issued: 0,
        profile_image_url: profileImageUrl,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
      if (upsertError) {
        console.error("Error upserting loan_helpers:", upsertError)
        return { success: false, error: "Failed to upsert loan_helpers: " + upsertError.message }
      }
      // Notify all users that this user created loan offers
      try {
        const { createNotificationsForUsers } = await import("@/lib/actions/notifications")
        const { data: allProfiles, error: profilesError } = await adminClient.from("profiles").select("id")
        if (!profilesError && allProfiles && allProfiles.length > 0) {
          const userIds = allProfiles.map((p: any) => p.id)
          await createNotificationsForUsers({
            userIds,
            actorId: userId,
            type: "loan_helper_set",
            data: { userId, loanAmount, repaymentTime, repaymentUnit },
          })
        }
      } catch (notifyErr) {
        console.error("Failed to broadcast loan helper set notification:", notifyErr)
      }
    }

    revalidatePath("/profile")
    return { success: true, error: null }
  } catch (error) {
    console.error("Unexpected error updating loan helper settings:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
