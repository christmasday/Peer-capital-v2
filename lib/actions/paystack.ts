"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { getCurrentUserId, getUserEmail } from "@/lib/auth-utils"

// Define types for the virtual account
interface VirtualAccount {
  id: string
  account_number: string
  account_name: string
  bank_name: string
  bank_code: string
  currency: string
  assigned: boolean
  created_at: string
  updated_at: string
}

interface PaystackResponse {
  status: boolean
  message: string
  data?: {
    bank: {
      name: string
      id: number
      slug: string
    }
    account_name: string
    account_number: string
    assigned: boolean
    currency: string
    metadata: any
    active: boolean
    id: number
    created_at: string
    updated_at: string
    assignment: {
      integration: number
      assignee_id: number
      assignee_type: string
      expired: boolean
      account_type: string
      assigned_at: string
      expired_at: null | string
    }
  }
}

export async function createVirtualAccount() {
  try {
    const adminClient = createAdminClient()

    // Get the current user ID using our robust helper function
    const userId = await getCurrentUserId()

    if (!userId) {
      console.error("Authentication failed: No user ID found")
      return { error: "You must be logged in to create a virtual account" }
    }

    console.log("Creating virtual account for user:", userId)

    // Get user profile data
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError)
      return { error: "Could not fetch user profile" }
    }

    // Get the user's email using our robust helper function
    const userEmail = await getUserEmail(userId)

    if (!userEmail) {
      console.error("Could not determine user email")
      return { error: "Could not determine your email address" }
    }

    // Check if user already has a virtual account
    const { data: existingAccount, error: existingAccountError } = await adminClient
      .from("virtual_accounts")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (existingAccount) {
      return {
        success: false,
        message: "You already have a virtual account",
        virtualAccount: existingAccount,
      }
    }

    // Make API call to Paystack
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
    if (!PAYSTACK_SECRET_KEY) {
      console.error("Paystack secret key not found")
      return { error: "Payment provider configuration error" }
    }

    // Prepare the request payload - use the email we've safely retrieved
    const payload = {
      email: userEmail,
      first_name: profile.first_name || "User",
      middle_name: profile.middle_name || "",
      last_name: profile.last_name || "Account",
      phone: profile.phone_number || "00000000000",
      preferred_bank: "wema-bank", // You can make this configurable
      country: "NG",
      bvn: profile.bvn || "",
    }

    console.log("Sending request to Paystack with payload:", {
      ...payload,
      // Don't log sensitive fields
      email: payload.email ? "****@****.com" : "undefined",
      bvn: payload.bvn ? "********" : "undefined",
    })

    // Make the API call
    const response = await fetch("https://api.paystack.co/dedicated_account/assign", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseData: PaystackResponse = await response.json()

    if (!responseData.status) {
      console.error("Paystack API error:", responseData.message)
      return { error: responseData.message || "Failed to create virtual account" }
    }

    // Store the virtual account in the database
    if (responseData.data) {
      const virtualAccountData = {
        user_id: userId,
        account_number: responseData.data.account_number,
        account_name: responseData.data.account_name,
        bank_name: responseData.data.bank.name,
        bank_code: responseData.data.bank.slug,
        currency: responseData.data.currency,
        assigned: responseData.data.assigned,
        paystack_id: responseData.data.id.toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: insertError } = await adminClient.from("virtual_accounts").insert(virtualAccountData)

      if (insertError) {
        console.error("Error storing virtual account:", insertError)
        return { error: "Failed to store virtual account details" }
      }

      // Return success
      revalidatePath("/profile")
      return {
        success: true,
        message: "Virtual account created successfully",
        virtualAccount: virtualAccountData,
      }
    }

    return { error: "No data returned from payment provider" }
  } catch (error) {
    console.error("Error creating virtual account:", error)
    return { error: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

export async function getVirtualAccount(userId?: string) {
  try {
    const adminClient = createAdminClient()

    // If userId is not provided, get the current user
    if (!userId) {
      userId = await getCurrentUserId()

      if (!userId) {
        console.error("Authentication failed: No user ID found")
        return { error: "You must be logged in to view virtual account details" }
      }
    }

    console.log("Fetching virtual account for user:", userId)

    // Get the virtual account
    const { data: virtualAccount, error } = await adminClient
      .from("virtual_accounts")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No virtual account found
        return { success: false, message: "No virtual account found" }
      }
      console.error("Error fetching virtual account:", error)
      return { error: "Failed to fetch virtual account details" }
    }

    return { success: true, virtualAccount }
  } catch (error) {
    console.error("Error fetching virtual account:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
