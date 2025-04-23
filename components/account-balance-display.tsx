"use client"

import { useEffect, useState } from "react"
import { type AccountBalance, ensureAccountBalance } from "@/utils/account-balance"

export default function AccountBalanceDisplay() {
  const [accountBalance, setAccountBalance] = useState<AccountBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAccountBalance() {
      try {
        setLoading(true)
        const balance = await ensureAccountBalance()
        setAccountBalance(balance)
      } catch (err) {
        setError("Failed to load account balance")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadAccountBalance()
  }, [])

  if (loading) {
    return <div className="p-4 text-center">Loading account balance...</div>
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>
  }

  if (!accountBalance) {
    return <div className="p-4 text-center">No account balance found</div>
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Account Balance</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Available Balance</p>
          <p className="text-2xl font-bold">${accountBalance.balance.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Loan Balance</p>
          <p className="text-2xl font-bold text-red-500">${accountBalance.loan_balance.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
