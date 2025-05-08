"use client"

import { useState, useEffect, useCallback } from "react"
import { getUsers } from "@/lib/actions/admin"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, UserCog } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { format } from "date-fns"

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  raw_user_meta_data: any
}

interface UserSearchProps {
  onSelectUser: (user: User) => void
}

export function UserSearch({ onSelectUser }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getUsers(debouncedSearchTerm, page)

      if (result.error) {
        setError(result.error)
      } else {
        setUsers(result.users || [])
        setTotalPages(result.totalPages || 1)
      }
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchTerm, page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return format(new Date(dateString), "MMM d, yyyy h:mm a")
  }

  const getUserName = (user: User) => {
    const metadata = user.raw_user_meta_data || {}
    const firstName = metadata.first_name || ""
    const lastName = metadata.last_name || ""

    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim()
    }

    return "N/A"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Search</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={fetchUsers} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>

        {error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : loading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {debouncedSearchTerm ? "No users found matching your search" : "No users found"}
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{getUserName(user)}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => onSelectUser(user)} title="Manage user">
                          <UserCog className="h-4 w-4" />
                        </Button>
                      </TableCell>
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
