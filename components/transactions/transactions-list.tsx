"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

interface StablesRailTransaction {
  id: string
  type: string
  direction: string
  amount: number
  currency: string
  status: string
  transactionReference?: string
  walletAddress?: string
  mintTxHash?: string
  depositor?: { name: string; accountNumber: string; bankName: string }
  bankAccount?: { accountNumber: string; accountNumber?: string; bankName: string }
  processingFee?: number
  totalDeducted?: number
  createdAt: string
  completedAt?: string
  updatedAt?: string
}

export function TransactionsList() {
  const statusOptions = [
    { value: "all", label: "All" },
    { value: "completed", label: "Completed" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "failed", label: "Failed" },
    { value: "cancelled", label: "Cancelled" },
  ]
  const [statusFilter, setStatusFilter] = useState("all")
  const [transactions, setTransactions] = useState<StablesRailTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/transactions", { credentials: "include" })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "Failed to fetch transactions")
          setTransactions([])
          return
        }

        setTransactions(data.transactions || [])
      } catch (err: any) {
        setError(err.message || "Failed to fetch transactions")
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  const filteredTransactions = (statusFilter === "all")
    ? transactions
    : transactions.filter((t) => t.status === statusFilter)

  const formatAmount = (amount: number, currency?: string) => {
    const formatted = Number.isFinite(amount)
      ? amount.toLocaleString(undefined, { maximumFractionDigits: 6 })
      : "0"
    return `${formatted} ${currency || "NGN"}`
  }

  const shortenHash = (hash: string) => {
    if (!hash || hash.length < 14) {
      return hash
    }
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`
  }

  const getExplorerTxUrl = (network: string | null | undefined, txHash: string | null | undefined) => {
    if (!txHash) {
      return null
    }

    const normalized = (network || "base").toLowerCase()

    if (normalized.includes("tron") || normalized === "trx") {
      return `https://tronscan.org/#/transaction/${txHash}`
    }

    const evmExplorers: Record<string, string> = {
      base: "https://basescan.org/tx/",
      ethereum: "https://etherscan.io/tx/",
      eth: "https://etherscan.io/tx/",
      bsc: "https://bscscan.com/tx/",
      binance: "https://bscscan.com/tx/",
      polygon: "https://polygonscan.com/tx/",
      matic: "https://polygonscan.com/tx/",
      arbitrum: "https://arbiscan.io/tx/",
      optimism: "https://optimistic.etherscan.io/tx/",
    }

    const explorerBase = evmExplorers[normalized] || evmExplorers.base
    return `${explorerBase}${txHash}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "fintech_deposit":
      case "user_onramp":
        return "↓"
      case "fintech_offramp":
      case "user_offramp":
        return "↑"
      case "swap":
        return "⇄"
      default:
        return "•"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "fintech_deposit":
      case "user_onramp":
        return "text-green-600"
      case "fintech_offramp":
      case "user_offramp":
        return "text-red-600"
      case "swap":
        return "text-indigo-600"
      default:
        return "text-gray-600"
    }
  }

  const getDescription = (tx: StablesRailTransaction) => {
    switch (tx.type) {
      case "fintech_deposit":
      case "user_onramp":
        return `Fiat deposit${tx.depositor ? ` from ${tx.depositor.name}` : ""}`
      case "fintech_offramp":
      case "user_offramp":
        return `Payout to ${tx.bankAccount?.bankName || "bank account"}`
      case "swap":
        return "Token swap"
      default:
        return tx.type
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">Loading Transactions...</h3>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-red-500">
            <h3 className="text-lg font-medium mb-2">{error}</h3>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Status Filter Dropdown */}
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="statusFilter" className="font-medium text-gray-700">Filter by Status:</label>
        <select
          id="statusFilter"
          name="statusFilter"
          className="border rounded px-2 py-1"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {/* Transaction List */}
      {filteredTransactions && filteredTransactions.length > 0 ? (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${getTypeColor(transaction.type)} bg-opacity-10`}
                    >
                      <span className="text-xl">{getTypeIcon(transaction.type)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{getDescription(transaction)}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right sm:ml-4 flex flex-col items-end">
                    <p
                      className={`font-bold ${transaction.direction === "in" ? "text-green-600" : "text-red-600"}`}
                    >
                      {transaction.direction === "in" ? "+" : "-"}
                      {formatAmount(transaction.amount, transaction.currency)}
                    </p>
                    {(transaction.mintTxHash || transaction.transactionReference) && (
                      <div className="text-xs text-gray-500 mt-0.5 max-w-[320px]">
                        {transaction.mintTxHash ? (
                          <a
                            href={getExplorerTxUrl("base", transaction.mintTxHash) || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 mt-0.5"
                          >
                            {shortenHash(transaction.mintTxHash)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : transaction.transactionReference ? (
                          <p className="truncate">{transaction.transactionReference}</p>
                        ) : null}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getStatusColor(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No Transactions</h3>
              <p className="text-gray-500">
                No transactions were found yet. Fund your wallet or perform a swap to see activity here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
