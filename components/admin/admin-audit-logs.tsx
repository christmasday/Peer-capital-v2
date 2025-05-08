"use client"

import { useState, useEffect } from "react"
import { getAdminAuditLogs } from "@/lib/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface AuditLog {
  id: string
  action: string
  details: any
  created_at: string
  admin: {
    id: string
    email: string
  }
  target: {
    id: string
    email: string
  } | null
}

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getAdminAuditLogs(page)

        if (result.error) {
          setError(result.error)
        } else {
          setLogs(result.logs || [])
          setTotalPages(result.totalPages || 1)
        }
      } catch (err) {
        console.error("Error fetching audit logs:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [page])

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy h:mm:ss a")
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "password_reset":
        return <Badge variant="destructive">Password Reset</Badge>
      default:
        return <Badge>{action}</Badge>
    }
  }

  const formatDetails = (details: any) => {
    if (!details) return "N/A"

    try {
      if (typeof details === "string") {
        details = JSON.parse(details)
      }

      return Object.entries(details)
        .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
        .join(", ")
    } catch (error) {
      return JSON.stringify(details)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Audit Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : loading ? (
          <div className="text-center py-4">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No audit logs found</div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                      <TableCell>{log.admin?.email || "Unknown"}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>{log.target?.email || "N/A"}</TableCell>
                      <TableCell>{formatDetails(log.details)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={handlePreviousPage}
                      disabled={page === 1}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem className="flex items-center">
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={handleNextPage}
                      disabled={page === totalPages}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
