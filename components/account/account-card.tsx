"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Plus, ArrowRightLeft, TrendingUp, ArrowDown } from "lucide-react"

interface AccountCardProps {
  balance: string | number
  loanBalance: string | number
}

export function AccountCard({ balance, loanBalance }: AccountCardProps) {
  const [showBalance, setShowBalance] = useState(false)

  // Format the balance if it's a number
  const formattedBalance =
    typeof balance === "number"
      ? new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency: "NGN",
        }).format(balance)
      : balance

  // Format the loan balance if it's a number
  const formattedLoanBalance =
    typeof loanBalance === "number"
      ? new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency: "NGN",
        }).format(loanBalance)
      : loanBalance

  return (
    <div className="w-full rounded-3xl bg-blue-700 p-6 text-white overflow-hidden relative mb-6">
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600 rounded-full -mr-20 -mb-20"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-medium">Account Balance</div>
          <button className="text-white" onClick={() => setShowBalance(!showBalance)}>
            {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="text-3xl font-bold mb-2">{showBalance ? formattedBalance : "******"}</div>

        <div className="text-sm opacity-90 mb-12">
          &amp; Loan Balance {showBalance ? formattedLoanBalance : "*****"}
        </div>

        <div className="flex justify-between items-center">
          <Link href="/account/fund" className="flex flex-col items-center">
            <div className="bg-white p-3 rounded-lg mb-2">
              <Plus className="h-5 w-5 text-blue-700" />
            </div>
            <span className="text-sm">Fund</span>
          </Link>

          <Link href="/account/withdraw" className="flex flex-col items-center">
            <div className="bg-white p-3 rounded-lg mb-2">
              <ArrowDown className="h-5 w-5 text-blue-700" />
            </div>
            <span className="text-sm">Withdraw</span>
          </Link>

          <div className="flex flex-col items-center">
            <div className="bg-white p-3 rounded-lg mb-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-700" />
            </div>
            <span className="text-sm">Transfer</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-white p-3 rounded-lg mb-2">
              <TrendingUp className="h-5 w-5 text-blue-700" />
            </div>
            <span className="text-sm">Loans</span>
          </div>
        </div>
      </div>
    </div>
  )
}
