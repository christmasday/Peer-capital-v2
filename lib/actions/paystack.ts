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
      return { error: "You must be logged in to create a virtual account" }
    }


    // Get user profile data
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      return { error: "Could not fetch user profile" }
    }

    // Get the user's email using our robust helper function
    const userEmail = await getUserEmail(userId)

    if (!userEmail) {
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
      return { error: "Payment provider configuration error" }
    }

    // Prepare the request payload - use the email we've safely retrieved
    const payload = {
      email: userEmail,
      first_name: profile.first_name || "User",
      middle_name: profile.middle_name || "",
      last_name: profile.last_name || "Account",
      phone: profile.phone_number || "00000000000",
      preferred_bank: process.env.PAYSTACK_PREFERRED_BANK || "providus-bank", // Using environment variable with fallback
      country: "NG",
      bvn: profile.bvn || "",
    }

    try {
      // Make the API call
      const response = await fetch("https://api.paystack.co/dedicated_account/assign", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const responseText = await response.text()
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseErr) {
        responseData = { raw: responseText }
      }

      if (!responseData.status) {
        return { error: responseData.message || "Failed to create virtual account", raw: responseData }
      }

      if (!responseData.data) {
        // No account details yet, show in-progress message
        return {
          success: false,
          message: responseData.message || "Virtual account creation in progress. Please check back later.",
          paystackResponse: responseData,
          inProgress: true,
        }
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
          return { error: "Failed to store virtual account details", raw: responseData }
        }

        // Return success
        revalidatePath("/profile")
        return {
          success: true,
          message: "Virtual account created successfully",
          virtualAccount: virtualAccountData,
          paystackResponse: responseData,
        }
      }

      return { error: "No data returned from payment provider", raw: responseData }
    } catch (fetchErr) {
      return { error: "Error during Paystack fetch", fetchErr: fetchErr instanceof Error ? fetchErr.message : fetchErr }
    }
  } catch (error) {
    return { error: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

export async function getVirtualAccount(emailOrUserId?: string) {
  try {
    const adminClient = createAdminClient()

    let email = emailOrUserId;
    // If not provided, get the current user's email
    if (!emailOrUserId) {
      const userId = await getCurrentUserId()
      if (!userId) {
        return { error: "You must be logged in to view virtual account details" }
      }
      // Fetch email from profile
      const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single()
      if (profileError || !profile?.email) {
        return { error: "Could not determine your email address" }
      }
      email = profile.email
    } else if (emailOrUserId && emailOrUserId.includes("@")) {
      // Already an email
      email = emailOrUserId
    } else {
      // If a user id is provided, fetch the email
      const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("email")
        .eq("id", emailOrUserId)
        .single()
      if (profileError || !profile?.email) {
        return { error: "Could not determine your email address" }
      }
      email = profile.email
    }

    if (!email || typeof email !== "string") {
      return { error: "Could not determine your email address" };
    }

    // 1. Check the local database for the virtual account
    const { data: virtualAccount, error } = await adminClient
      .from("virtual_accounts")
      .select("*")
      .eq("email", email)
      .single()

    if (virtualAccount) {
      return { success: true, virtualAccount };
    }
    if (error && error.code !== "PGRST116") {
      // Only log/return if it's not a "not found" error
      return { error: "Failed to fetch virtual account details" }
    }

    // 2. If not found, fetch from Paystack API
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET_KEY) {
      return { error: "Paystack secret key not configured" };
    }
    const url = `https://api.paystack.co/customer/${encodeURIComponent(email)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const responseData = await response.json();
    if (response.ok && responseData.status && responseData.data) {
      const customer = responseData.data;
      if (customer.dedicated_account) {
        // Upsert the dedicated account into the virtual_accounts table
        const va = customer.dedicated_account;
        // Look up user_id by email
        const { data: userProfile } = await adminClient
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single();
        const user_id = userProfile?.id || null;
        const virtualAccountData = {
          email: email,
          user_id: user_id,
          account_number: va.account_number,
          account_name: va.account_name,
          bank_name: va.bank_name || va.bank?.name,
          bank_code: va.bank_code || va.bank?.id?.toString(),
          currency: va.currency,
          assigned: va.assigned ?? true,
          paystack_id: va.id?.toString(),
          created_at: va.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await adminClient
          .from("virtual_accounts")
          .upsert([virtualAccountData], { onConflict: "email" });
        return { success: true, virtualAccount: virtualAccountData, paystackCustomer: customer };
      }
    }

    // If still not found, return not found
    return { success: false, message: "No virtual account found" }
  } catch (error) {
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Validate account with Paystack (account number, bank code, bvn)
export async function validateAccountWithPaystack({ account_number, bank_code, bvn }: { account_number: string, bank_code: string, bvn: string }) {
  try {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET_KEY) {
      return { success: false, error: "Paystack secret key not configured" };
    }
    const response = await fetch("https://api.paystack.co/bank/resolve", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      // Pass params as query string
      // Paystack expects: account_number, bank_code, bvn
    });
    // Actually, Paystack's validate account endpoint is:
    // https://api.paystack.co/bank/validate?account_number=...&bank_code=...&bvn=...
    const url = `https://api.paystack.co/bank/validate?account_number=${encodeURIComponent(account_number)}&bank_code=${encodeURIComponent(bank_code)}&bvn=${encodeURIComponent(bvn)}`;
    const validateRes = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const data = await validateRes.json();
    if (data.status) {
      return { success: true, data: data.data };
    } else {
      return { success: false, error: data.message || "Validation failed" };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || "Validation failed" };
  }
}

// Validate customer identification with Paystack
export async function validateCustomerIdentification({
  country,
  type,
  account_number,
  bvn,
  bank_code,
  first_name,
  last_name,
  email,
}: {
  country: string;
  type: string;
  account_number: string;
  bvn: string;
  bank_code: string;
  first_name: string;
  last_name: string;
  email: string;
}) {
  try {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET_KEY) {
      return { success: false, error: "Paystack secret key not configured" };
    }
    // Use email as the customer_code in the URL
    const url = `https://api.paystack.co/customer/${encodeURIComponent(email)}/identification`;
    const payload = {
      country,
      type,
      account_number,
      bvn,
      bank_code,
      first_name,
      last_name,
    };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (err) {
      responseData = { raw: responseText };
    }
    if (response.ok && responseData.status) {
      return { success: true, data: responseData.data, message: responseData.message };
    } else {
      return { success: false, error: responseData.message || "Identification failed", raw: responseData };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || "Identification failed" };
  }
}
