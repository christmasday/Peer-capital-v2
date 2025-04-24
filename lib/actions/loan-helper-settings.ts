"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export type LoanHelperSettings = {
  id: string
  user_id: string
  loan_amount: number
  interest_rate: number
  repayment_time: number
  terms_and_conditions: string | null
  created_at: string
  updated_at: string
}

export async function getLoanHelperSettings(
  userId: string,
): Promise<{ data: LoanHelperSettings | null; error: string | null }> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase.from("loan_helper_settings").select("*").eq("user_id", userId).maybeSingle()

    if (error) {
      console.error("Error fetching loan helper settings:", error)
      return { data: null, error: "Failed to fetch loan helper settings" }
    }

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
    } else {
      const { error: insertError } = await adminClient.from("loan_helper_settings").insert(settingsData)

      if (insertError) {
        console.error("Error inserting loan helper settings:", insertError)
        return { success: false, error: "Failed to insert loan helper settings" }
      }
    }

    revalidatePath("/profile")
    return { success: true, error: null }
  } catch (error) {
    console.error("Unexpected error updating loan helper settings:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
