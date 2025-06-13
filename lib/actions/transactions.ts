"use server"

import { createServerClient } from "@/lib/supabase/server"
import { getJWTFromCookies, verifyJWT } from "@/lib/jwt"
import { createAdminClient } from "@/lib/supabase/admin"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { checkAuth } from "@/lib/auth-utils"
import { getUserProfile } from "@/lib/actions/auth"


export async function getUserTransactions(supabase: SupabaseClient<Database>) {
  try {
    // Use checkAuth to ensure the user is authenticated
    await checkAuth()

    // Get the user profile
    const userProfile = await getUserProfile()
    console.log('[getUserTransactions] userProfile:', userProfile)

    const userId = userProfile?.user?.id
    if (!userId) {
      console.log('[getUserTransactions] No userId found in userProfile')
      return { transactions: [] }
    }
    console.log('[getUserTransactions] userId:', userId)

    // Log the Supabase session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('[getUserTransactions] Supabase session:', sessionData)
    if (sessionError) {
      console.log('[getUserTransactions] Supabase session error:', sessionError)
    }

    // Get all transactions for the user
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    // Debug: Log the query result and error
    console.log('[getUserTransactions] Query result:', data)
    if (error) {
      console.log('[getUserTransactions] Query error:', error)
    }

    return { success: true, transactions: data }
  } catch (error) {
    // Debug: Log unexpected error
    console.log('[getUserTransactions] Unexpected error:', error)
    return { transactions: [] }
  }
}

export async function getTransactionById(id: string) {
  try {
    // Check for JWT first
    const jwt = getJWTFromCookies()
    let userId = null

    if (jwt) {
      try {
        const { payload, error } = await verifyJWT(jwt)
        if (!error && payload && payload.userId) {
          userId = payload.userId
        }
      } catch (error) {
      }
    }

    // If no userId from JWT, try Supabase session
    if (!userId) {
      const supabase = createServerClient()
      const { data: sessionData } = await supabase.auth.getSession()

      if (sessionData.session?.user) {
        userId = sessionData.session.user.id
      }
    }


    // Get the transaction
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from("transactions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (error) {
      return { error: "Transaction not found" }
    }

    return { transaction: data }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}
