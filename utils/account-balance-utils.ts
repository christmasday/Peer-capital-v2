import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function getAccountBalance(userId: string) {
  try {
    const adminClient = createAdminClient()

    // Get the account balance for the user
    const { data, error } = await adminClient.from("account_balances").select("*").eq("user_id", userId).single()

    if (error) {
      return { balance: 0, loan_balance: 0 }
    }

    return {
      balance: data.balance || 0,
      loan_balance: data.loan_balance || 0,
    }
  } catch (error) {
    return { balance: 0, loan_balance: 0 }
  }
}

export async function getCurrentUserAccountBalance() {
  try {
    const supabase = createServerClient()

    // Get the current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { balance: 0, loan_balance: 0 }
    }

    return getAccountBalance(session.user.id)
  } catch (error) {
    return { balance: 0, loan_balance: 0 }
  }
}
