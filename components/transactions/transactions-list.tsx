"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import Link from "next/link"

export function TransactionsList() {
  const statusOptions = [
    { value: "all", label: "All" },
    { value: "completed", label: "Completed" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "defaulted", label: "Defaulted" },
  ]
  const [statusFilter, setStatusFilter] = useState("all")
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rechecking, setRechecking] = useState<string | null>(null)
  const [recheckError, setRecheckError] = useState<{ [reference: string]: string | null }>({})

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true)
      setError(null)
      try {
        // Get account number from localStorage (set by profile or home page)
        let accountNumber = null
        try {
          const userProfile = JSON.parse(localStorage.getItem("userProfile") || "null")
          accountNumber = userProfile?.profile?.account_number
        } catch {}
        if (!accountNumber) {
          setError("No account number found")
          setLoading(false)
          return
        }
        const res = await fetch("/api/alat/wallet/wallet-transaction-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ accountNumber }),
        })
        const data = await res.json()
        // Assume data.result is an array of transactions
        setTransactions(data.result || [])
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
    : transactions.filter((t: any) => t.status === statusFilter)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      case "defaulted":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return "↓"
      case "withdrawal":
        return "↑"
      case "loan_request":
        return "⟳"
      case "loan_repayment":
        return "⟲"
      case "transfer":
        return "↔"
      default:
        return "•"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "text-green-600"
      case "withdrawal":
        return "text-red-600"
      case "loan_request":
        return "text-blue-600"
      case "loan_repayment":
        return "text-orange-600"
      case "transfer":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  async function handleRecheck(reference: string) {
    setRechecking(reference)
    setRecheckError(prev => ({ ...prev, [reference]: null }))
    try {
      const res = await fetch("/api/transactions/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reference }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setRecheckError(prev => ({ ...prev, [reference]: data.error || "Failed to verify transaction" }))
        return
      }
      // Refetch all transactions from the API to get the latest status
      try {
        const txRes = await fetch("/api/transactions", { credentials: "include" })
        if (txRes.ok) {
          const txData = await txRes.json()
          setTransactions(txData.transactions || [])
        }
      } catch {}
      // Trigger account balance refresh
      window.dispatchEvent(new Event("refresh-account-balance"))
    } catch (err: any) {
      setRecheckError(prev => ({ ...prev, [reference]: err.message || "Failed to verify transaction" }))
    } finally {
      setRechecking(null)
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
          {filteredTransactions.map((transaction: any) => (
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
                      <h3 className="font-medium">{transaction.description}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right sm:ml-4 flex flex-col items-end">
                    <p
                      className={`font-bold ${transaction.type === "deposit" ? "text-green-600" : transaction.type === "withdrawal" ? "text-red-600" : "text-blue-600"}`}
                    >
                      {transaction.type === "deposit" ? "+" : transaction.type === "withdrawal" ? "-" : ""}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getStatusColor(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Badge>
                      <Link href={`/transactions/receipt/${transaction.id}`}>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <FileText className="h-3 w-3 mr-1" />
                          Receipt
                        </Button>
                      </Link>
                      {/* Recheck button for pending transactions */}
                      {transaction.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2"
                          disabled={rechecking === transaction.reference}
                          onClick={() => handleRecheck(transaction.reference)}
                        >
                          {rechecking === transaction.reference ? "Rechecking..." : "Recheck"}
                        </Button>
                      )}
                    </div>
                    {/* Show error if recheck fails */}
                    {recheckError[transaction.reference] && rechecking === null && (
                      <div className="text-xs text-red-500 mt-1">{recheckError[transaction.reference]}</div>
                    )}
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
                You haven't made any transactions yet. Fund your account or request a loan to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
} 