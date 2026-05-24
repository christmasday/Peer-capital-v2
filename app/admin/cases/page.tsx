"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Filter,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface CaseProfile {
  id: string
  email: string | null
  name: string
}

interface SupportCase {
  id: string
  category: string
  subject: string
  description: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  email: string
  user_id: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  reporter: CaseProfile | null
  assignee: CaseProfile | null
}

interface CaseResponse {
  id: string
  ticket_id: string
  user_id: string | null
  message: string
  is_staff_response: boolean
  created_at: string
  author: CaseProfile | null
}

interface CaseSummary {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const defaultSummary: CaseSummary = {
  total: 0,
  open: 0,
  in_progress: 0,
  resolved: 0,
  closed: 0,
}

const STATUS_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
]

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
]

const CATEGORY_OPTIONS = [
  "technical",
  "payment",
  "account",
  "loan",
  "security",
  "other",
]

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function statusBadgeClass(status: SupportCase["status"]) {
  if (status === "open") return "bg-amber-100 text-amber-800"
  if (status === "in_progress") return "bg-blue-100 text-blue-800"
  if (status === "resolved") return "bg-green-100 text-green-800"
  return "bg-slate-200 text-slate-700"
}

function priorityBadgeClass(priority: SupportCase["priority"]) {
  if (priority === "urgent") return "bg-red-100 text-red-700"
  if (priority === "high") return "bg-orange-100 text-orange-700"
  if (priority === "medium") return "bg-yellow-100 text-yellow-700"
  return "bg-slate-200 text-slate-700"
}

export default function AdminCasesPage() {
  const { toast } = useToast()

  const [cases, setCases] = useState<SupportCase[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null)
  const [responses, setResponses] = useState<CaseResponse[]>([])

  const [summary, setSummary] = useState<CaseSummary>(defaultSummary)
  const [staffMembers, setStaffMembers] = useState<CaseProfile[]>([])

  const [loadingCases, setLoadingCases] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingCase, setUpdatingCase] = useState(false)
  const [sendingResponse, setSendingResponse] = useState(false)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [assignedFilter, setAssignedFilter] = useState("all")

  const [responseMessage, setResponseMessage] = useState("")
  const [responseStatus, setResponseStatus] = useState("no_change")

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })

  const fetchCases = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoadingCases(true)

    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        assignedTo: assignedFilter,
      })

      if (search.trim()) {
        params.set("search", search.trim())
      }

      const response = await fetch(`/api/admin/cases?${params.toString()}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to load support cases")
      }

      const data = await response.json()
      const nextCases: SupportCase[] = data.cases || []

      setCases(nextCases)
      setSummary(data.summary || defaultSummary)
      setStaffMembers(data.staffMembers || [])
      setPagination(data.pagination)

      if (!selectedCaseId && nextCases.length > 0) {
        setSelectedCaseId(nextCases[0].id)
      }

      if (selectedCaseId && !nextCases.find((item) => item.id === selectedCaseId)) {
        setSelectedCaseId(nextCases[0]?.id || null)
      }
    } catch (error) {
      console.error("Error fetching support cases:", error)
      toast({
        title: "Error",
        description: "Failed to load support cases",
        variant: "destructive",
      })
    } finally {
      setLoadingCases(false)
      setRefreshing(false)
    }
  }, [pagination.page, pagination.limit, search, statusFilter, priorityFilter, categoryFilter, assignedFilter, selectedCaseId, toast])

  const fetchCaseDetails = useCallback(async (caseId: string) => {
    setLoadingDetails(true)

    try {
      const response = await fetch(`/api/admin/cases/${caseId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to load case details")
      }

      const data = await response.json()
      setSelectedCase(data.case)
      setResponses(data.responses || [])
    } catch (error) {
      console.error("Error fetching case details:", error)
      toast({
        title: "Error",
        description: "Could not load case details",
        variant: "destructive",
      })
    } finally {
      setLoadingDetails(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  useEffect(() => {
    if (selectedCaseId) {
      fetchCaseDetails(selectedCaseId)
    } else {
      setSelectedCase(null)
      setResponses([])
    }
  }, [selectedCaseId, fetchCaseDetails])

  const selectedCaseIndex = useMemo(() => {
    if (!selectedCaseId) return -1
    return cases.findIndex((item) => item.id === selectedCaseId)
  }, [cases, selectedCaseId])

  const handleCaseUpdate = async (payload: {
    status?: string
    priority?: string
    assignedTo?: string | null
  }) => {
    if (!selectedCase) return

    setUpdatingCase(true)

    try {
      const response = await fetch("/api/admin/cases", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caseId: selectedCase.id,
          ...payload,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json()
        throw new Error(errorBody.error || "Failed to update case")
      }

      await Promise.all([fetchCases(), fetchCaseDetails(selectedCase.id)])
      toast({
        title: "Case updated",
        description: "Case fields updated successfully",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update case",
        variant: "destructive",
      })
    } finally {
      setUpdatingCase(false)
    }
  }

  const handleSubmitResponse = async () => {
    if (!selectedCase || !responseMessage.trim()) return

    setSendingResponse(true)

    try {
      const response = await fetch(`/api/admin/cases/${selectedCase.id}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: responseMessage,
          status: responseStatus === "no_change" ? undefined : responseStatus,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json()
        throw new Error(errorBody.error || "Failed to send response")
      }

      setResponseMessage("")
      setResponseStatus("no_change")
      await Promise.all([fetchCases(), fetchCaseDetails(selectedCase.id)])

      toast({
        title: "Response sent",
        description: "Case note added successfully",
      })
    } catch (error) {
      toast({
        title: "Response failed",
        description: error instanceof Error ? error.message : "Failed to send response",
        variant: "destructive",
      })
    } finally {
      setSendingResponse(false)
    }
  }

  const handleApplyFilters = (event: React.FormEvent) => {
    event.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchCases()
  }

  const movePage = (nextPage: number) => {
    setPagination((prev) => ({ ...prev, page: nextPage }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Case Management</h1>
          <p className="text-muted-foreground">
            Review reported problems, assign ownership, and resolve cases faster.
          </p>
        </div>
        <Button onClick={() => fetchCases(true)} variant="outline" disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Cases</CardDescription>
            <CardTitle className="text-2xl">{summary.total}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center text-xs text-muted-foreground">
              <ClipboardList className="mr-1 h-3 w-3" />
              Cases in current queue
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open</CardDescription>
            <CardTitle className="text-2xl text-amber-700">{summary.open}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            <AlertCircle className="mr-1 inline h-3 w-3" />
            Awaiting assignment
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-2xl text-blue-700">{summary.in_progress}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            <Clock className="mr-1 inline h-3 w-3" />
            Actively worked on
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolved</CardDescription>
            <CardTitle className="text-2xl text-green-700">{summary.resolved}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            <CheckCircle2 className="mr-1 inline h-3 w-3" />
            Solution delivered
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Closed</CardDescription>
            <CardTitle className="text-2xl text-slate-700">{summary.closed}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            <ShieldAlert className="mr-1 inline h-3 w-3" />
            Archived/finished
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleApplyFilters} className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search subject, description, or email"
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" className="md:justify-self-end">
              Apply
            </Button>
          </form>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORY_OPTIONS.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignments</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {staffMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <CardHeader>
            <CardTitle>Reported Cases</CardTitle>
            <CardDescription>
              Select a case to review details and manage progress.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingCases ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading cases...
              </div>
            ) : cases.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No cases found for the current filter set.
              </div>
            ) : (
              <>
                <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                  {cases.map((supportCase) => (
                    <button
                      key={supportCase.id}
                      type="button"
                      onClick={() => setSelectedCaseId(supportCase.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedCaseId === supportCase.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="line-clamp-1 text-sm font-semibold">{supportCase.subject}</p>
                        <Badge className={statusBadgeClass(supportCase.status)}>
                          {supportCase.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="mb-2 flex items-center gap-2">
                        <Badge className={priorityBadgeClass(supportCase.priority)}>
                          {supportCase.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{supportCase.category}</span>
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {supportCase.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{supportCase.assignee?.name || "Unassigned"}</span>
                        <span>{formatDate(supportCase.created_at)}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t pt-3 text-sm">
                  <span className="text-muted-foreground">
                    Page {pagination.page} of {Math.max(pagination.pages, 1)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pagination.page <= 1}
                      onClick={() => movePage(pagination.page - 1)}
                    >
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => movePage(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-7">
          <CardHeader>
            <CardTitle>Case Workspace</CardTitle>
            <CardDescription>
              Review context, assign owner, and publish internal updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedCaseId ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Select a case from the left panel.
              </div>
            ) : loadingDetails ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading case details...
              </div>
            ) : selectedCase ? (
              <div className="space-y-6">
                <div className="space-y-3 rounded-lg border bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={statusBadgeClass(selectedCase.status)}>
                      {selectedCase.status.replace("_", " ")}
                    </Badge>
                    <Badge className={priorityBadgeClass(selectedCase.priority)}>
                      {selectedCase.priority}
                    </Badge>
                    <Badge variant="outline">{selectedCase.category}</Badge>
                  </div>

                  <h2 className="text-lg font-semibold">{selectedCase.subject}</h2>

                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p>
                      Reporter: {selectedCase.reporter?.name || "Unknown user"}
                    </p>
                    <p>Email: {selectedCase.email}</p>
                    <p>Created: {formatDate(selectedCase.created_at)}</p>
                    <p>Updated: {formatDate(selectedCase.updated_at)}</p>
                  </div>

                  <p className="whitespace-pre-wrap text-sm text-slate-700">
                    {selectedCase.description}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Status</p>
                    <Select
                      value={selectedCase.status}
                      onValueChange={(value) => handleCaseUpdate({ status: value })}
                      disabled={updatingCase}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Priority</p>
                    <Select
                      value={selectedCase.priority}
                      onValueChange={(value) => handleCaseUpdate({ priority: value })}
                      disabled={updatingCase}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Assignee</p>
                    <Select
                      value={selectedCase.assigned_to || "unassigned"}
                      onValueChange={(value) =>
                        handleCaseUpdate({ assignedTo: value === "unassigned" ? null : value })
                      }
                      disabled={updatingCase}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {staffMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="h-4 w-4" />
                    Case timeline
                  </div>
                  <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-3">
                    {responses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No responses yet.</p>
                    ) : (
                      responses.map((response) => (
                        <div key={response.id} className="rounded-md bg-slate-50 p-3 text-sm">
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              {response.author?.name || "Staff member"}
                            </span>
                            <span>{formatDate(response.created_at)}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-slate-700">{response.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border p-3">
                  <p className="text-sm font-medium">Add response</p>
                  <Textarea
                    value={responseMessage}
                    onChange={(event) => setResponseMessage(event.target.value)}
                    placeholder="Write the investigation note, action, or resolution update..."
                    rows={4}
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <Select value={responseStatus} onValueChange={setResponseStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Optional status update" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_change">No status change</SelectItem>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            Mark as {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleSubmitResponse}
                      disabled={!responseMessage.trim() || sendingResponse}
                    >
                      {sendingResponse ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send response"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                The selected case could not be loaded.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedCaseIndex >= 0 && cases[selectedCaseIndex] && (
        <p className="text-xs text-muted-foreground">
          Active case: {cases[selectedCaseIndex].subject}
        </p>
      )}
    </div>
  )
}
