import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export type AccountBalance = {
  id: string
  user_id: string
  balance: number
  loan_balance: number
  created_at: string
  updated_at: string
}

export async function ensureAccountBalance(): Promise<AccountBalance | null> {
  const supabase = createClientComponentClient()

  // Check if the user already has an account balance
  const { data: existingBalance, error: checkError } = await supabase.from("account_balances").select("*").maybeSingle()

  if (checkError) {
    console.error("Error checking account balance:", checkError)
    throw new Error("Failed to check account balance")
  }

  // If the user already has an account balance, return it
  if (existingBalance) {
    return existingBalance
  }

  // Otherwise, create a new account balance
  try {
    const response = await fetch("/api/account-balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to create account balance")
    }

    const { data } = await response.json()
    return data
  } catch (error) {
    console.error("Error creating account balance:", error)
    return null
  }
}

export async function updateAccountBalance(balance?: number, loan_balance?: number): Promise<AccountBalance | null> {
  try {
    const response = await fetch("/api/account-balance", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ balance, loan_balance }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to update account balance")
    }

    const { data } = await response.json()
    return data
  } catch (error) {
    console.error("Error updating account balance:", error)
    return null
  }
}
