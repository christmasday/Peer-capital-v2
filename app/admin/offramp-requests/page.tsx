"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  ArrowDownRight, 
  Search, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  Banknote,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface OfframpRequest {
  id: string
  eventType: string
  requestId: string | null
  userId: string | null
  amount: number | null
  tokenAmount: number | null
  currency: string
  status: string
  walletAddress: string | null
  transactionHash: string | null
  bankAccountNumber: string | null
  bankAccountName: string | null
  bankName: string | null
  bankCode: string | null
  network: string
  failureReason: string | null
  processed: boolean
  createdAt: string
  rawPayload: any
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function OfframpRequestsPage() {
  const [requests, setRequests] = useState<OfframpRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<OfframpRequest | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const { toast } = useToast()

  const fetchRequests = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter })
      })

      const response = await fetch(`/api/admin/offramp-requests?${params}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setRequests(data.data || [])
        setPagination(data.pagination)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch offramp requests",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching offramp requests:', error)
      toast({
        title: "Error",
        description: "Failed to fetch offramp requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [pagination.page, pagination.limit, search, statusFilter, toast])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleRefresh = () => {
    fetchRequests(true)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchRequests()
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    })
  }

  const formatAmount = (amount: number | null, currency: string) => {
    if (amount === null) return "N/A"
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency === 'NGN' ? 'NGN' : 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatTokenAmount = (amount: number | null) => {
    if (amount === null) return "N/A"
    return `${amount.toLocaleString()} cNGN`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'transfer_confirmed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Banknote className="w-3 h-3 mr-1" />Transfer Confirmed</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    }
  }

  const getEventTypeBadge = (eventType: string) => {
    switch (eventType) {
      case 'swap.completed':
        return <Badge variant="outline" className="text-xs">Swap</Badge>
      case 'swap.failed':
        return <Badge variant="outline" className="text-xs text-red-600">Swap Failed</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{eventType}</Badge>
    }
  }

  const truncateString = (str: string | null, maxLength: number = 12) => {
    if (!str) return "N/A"
    if (str.length <= maxLength) return str
    return `${str.slice(0, maxLength / 2)}...${str.slice(-maxLength / 2)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offramp Requests</h1>
          <p className="text-muted-foreground">
            View and monitor all user offramp (crypto to fiat) requests
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by request ID, user ID, or idempotency key..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transfer Confirmed</CardTitle>
            <Banknote className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {requests.filter(r => r.status === 'transfer_confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {requests.filter(r => r.status === 'failed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Offramp Requests</CardTitle>
          <CardDescription>
            A list of all offramp requests from webhook events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No offramp requests found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Request ID</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Amount (NGN)</TableHead>
                    <TableHead>Token Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{getEventTypeBadge(request.eventType)}</TableCell>
                      <TableCell>
                        {request.requestId ? (
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {truncateString(request.requestId)}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(request.requestId!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {request.userId ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {truncateString(request.userId)}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(request.amount, request.currency)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatTokenAmount(request.tokenAmount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.bankName ? (
                          <span className="text-sm">{request.bankName}</span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Offramp Request Details</DialogTitle>
            <DialogDescription>
              Full details for this offramp request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Status and Event Type */}
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedRequest.status)}
                {getEventTypeBadge(selectedRequest.eventType)}
              </div>

              {/* Failure Reason (if failed) */}
              {selectedRequest.status === 'failed' && selectedRequest.failureReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Failure Reason</p>
                      <p className="text-sm text-red-700 mt-1">{selectedRequest.failureReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Request ID</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded break-all">
                      {selectedRequest.requestId || "N/A"}
                    </code>
                    {selectedRequest.requestId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(selectedRequest.requestId!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded break-all">
                      {selectedRequest.userId || "N/A"}
                    </code>
                    {selectedRequest.userId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(selectedRequest.userId!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount (NGN)</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatAmount(selectedRequest.amount, selectedRequest.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Token Amount</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatTokenAmount(selectedRequest.tokenAmount)}
                  </p>
                </div>
              </div>

              {/* Bank Details */}
              {(selectedRequest.bankName || selectedRequest.bankAccountNumber) && (
                <div className="space-y-4">
                  <h4 className="font-medium">Bank Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRequest.bankName && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
                        <p className="mt-1">{selectedRequest.bankName}</p>
                      </div>
                    )}
                    {selectedRequest.bankCode && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Bank Code</p>
                        <p className="mt-1">{selectedRequest.bankCode}</p>
                      </div>
                    )}
                    {selectedRequest.bankAccountName && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Account Name</p>
                        <p className="mt-1">{selectedRequest.bankAccountName}</p>
                      </div>
                    )}
                    {selectedRequest.bankAccountNumber && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                        <code className="text-sm bg-muted px-2 py-1 rounded mt-1 block">
                          {selectedRequest.bankAccountNumber}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Transaction Details */}
              {(selectedRequest.walletAddress || selectedRequest.transactionHash) && (
                <div className="space-y-4">
                  <h4 className="font-medium">Transaction Details</h4>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Network</p>
                    <Badge variant="secondary" className="mt-1">{selectedRequest.network}</Badge>
                  </div>
                  {selectedRequest.walletAddress && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Wallet Address</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm bg-muted px-2 py-1 rounded break-all">
                          {selectedRequest.walletAddress}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(selectedRequest.walletAddress!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedRequest.transactionHash && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Transaction Hash</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm bg-muted px-2 py-1 rounded break-all">
                          {selectedRequest.transactionHash}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(selectedRequest.transactionHash!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => window.open(`https://basescan.org/tx/${selectedRequest.transactionHash}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="mt-1">{formatDate(selectedRequest.createdAt)}</p>
              </div>

              {/* Raw Payload */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Raw Payload</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(selectedRequest.rawPayload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
