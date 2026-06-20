"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Filter,
  RefreshCw,
  UserRound,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Inbox,
  Ban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AdminLoanRequestsDashboardProps {
  loanRequests: any[]
}

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "pending", label: "Loan Requests" },
  { value: "offer_pending", label: "Loan Offers" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
] as const

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "offer_pending", label: "Offer Pending" },
  { value: "approved", label: "Approved" },
  { value: "active", label: "Active" },
  { value: "funded", label: "Funded" },
  { value: "disbursed", label: "Disbursed" },
  { value: "in_progress", label: "In Progress" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "defaulted", label: "Defaulted" },
  { value: "failed", label: "Failed" },
] as const

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    offer_pending: "bg-blue-100 text-blue-800 border-blue-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    active: "bg-green-100 text-green-800 border-green-200",
    funded: "bg-teal-100 text-teal-800 border-teal-200",
    disbursed: "bg-teal-100 text-teal-800 border-teal-200",
    in_progress: "bg-indigo-100 text-indigo-800 border-indigo-200",
    processing: "bg-purple-100 text-purple-800 border-purple-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    cancelled: "bg-gray-100 text-gray-600 border-gray-200",
    defaulted: "bg-red-100 text-red-800 border-red-200",
    failed: "bg-red-100 text-red-800 border-red-200",
  }

  return (
    <Badge
      variant="outline"
      className={`${styles[status] || "bg-gray-100 text-gray-700"} whitespace-nowrap font-medium`}
    >
      {status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())}
    </Badge>
  )
}

function TypeIcon({ status }: { status: string }) {
  if (status === "pending") return <Inbox className="h-3.5 w-3.5 text-yellow-600" />
  if (status === "offer_pending") return <Send className="h-3.5 w-3.5 text-blue-600" />
  if (status === "approved" || status === "active" || status === "funded" || status === "disbursed" || status === "completed")
    return <CheckCircle className="h-3.5 w-3.5 text-green-600" />
  if (status === "rejected") return <XCircle className="h-3.5 w-3.5 text-red-600" />
  if (status === "cancelled") return <Ban className="h-3.5 w-3.5 text-gray-500" />
  return <Clock className="h-3.5 w-3.5 text-gray-500" />
}

const formatName = (profile: any) => {
  if (!profile) return "Unknown"
  if (profile.username) return `@${profile.username}`
  return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown"
}

export function AdminLoanRequestsDashboard({ loanRequests }: AdminLoanRequestsDashboardProps) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = useMemo(() => {
    return loanRequests.filter((req) => {
      if (typeFilter !== "all" && req.status !== typeFilter) return false
      if (statusFilter !== "all" && req.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const borrowerName = formatName(req.borrower).toLowerCase()
        const helperName = formatName(req.helper).toLowerCase()
        if (!borrowerName.includes(q) && !helperName.includes(q)) return false
      }
      return true
    })
  }, [loanRequests, typeFilter, statusFilter, search])

  const stats = useMemo(() => {
    const total = loanRequests.length
    const pending = loanRequests.filter((r) => r.status === "pending").length
    const offers = loanRequests.filter((r) => r.status === "offer_pending").length
    const approved = loanRequests.filter((r) => ["approved", "active", "funded", "disbursed", "in_progress", "processing", "completed"].includes(r.status)).length
    const rejected = loanRequests.filter((r) => r.status === "rejected").length
    const cancelled = loanRequests.filter((r) => r.status === "cancelled").length
    return { total, pending, offers, approved, rejected, cancelled }
  }, [loanRequests])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Loan Requests & Offers</h1>
        <p className="text-sm text-slate-500 mt-1">
          View and manage all loan requests and offers across the platform
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-slate-900" },
          { label: "Pending", value: stats.pending, color: "text-yellow-600" },
          { label: "Offers", value: stats.offers, color: "text-blue-600" },
          { label: "Approved", value: stats.approved, color: "text-green-600" },
          { label: "Rejected", value: stats.rejected, color: "text-red-600" },
          { label: "Cancelled", value: stats.cancelled, color: "text-gray-500" },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by borrower or lender name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.location.reload()}
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500">
        Showing {filtered.length} of {loanRequests.length} loan requests
      </p>

      {/* Loan requests grid */}
      {filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 mb-1">No loan requests found</p>
            <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((req) => (
            <Card key={req.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start gap-3 pb-2 pt-4 px-4">
                <Avatar className="h-9 w-9 shrink-0">
                  {req.borrower?.profile_picture_url ? (
                    <AvatarImage src={req.borrower.profile_picture_url} alt={formatName(req.borrower)} />
                  ) : (
                    <AvatarFallback className="bg-blue-100">
                      <UserRound className="h-4 w-4 text-blue-500" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {formatName(req.borrower)}
                    </p>
                    <TypeIcon status={req.status} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Lender:</span>
                    <span className="font-medium text-slate-700 truncate">{formatName(req.helper)}</span>
                  </div>
                </div>
                <StatusBadge status={req.status} />
              </CardHeader>
              <CardContent className="pt-1 pb-4 px-4">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="text-sm font-bold text-blue-700 truncate">{formatCurrency(req.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Tenor</p>
                    <p className="text-sm font-semibold text-slate-800">{req.duration_months}m</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Interest</p>
                    <p className="text-sm font-semibold text-slate-800">{req.interest_rate}%</p>
                  </div>
                </div>
                {req.purpose && (
                  <div className="text-xs text-slate-500 truncate">
                    {req.purpose}
                  </div>
                )}
                <div className="text-xs text-slate-400 mt-1.5">
                  {new Date(req.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
