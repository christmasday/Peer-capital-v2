"use client"

import { useState, useEffect } from "react"
import { getPublicAuthUsers } from "@/lib/actions/auth-mirror"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

type User = {
  id: string
  email: string
  created_at: string
  raw_user_meta_data: any
  balance?: number
  loan_balance?: number
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [includeBalances, setIncludeBalances] = useState(false)

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getPublicAuthUsers(includeBalances)

      if (result.error) {
        setError(result.error)
      } else {
        setUsers(result.users || [])
      }
    } catch (err) {
      console.error("Error loading users:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [includeBalances])

  const toggleBalances = () => {
    setIncludeBalances(!includeBalances)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatMetadata = (metadata: any) => {
    if (!metadata) return "None"

    try {
      const firstName = metadata.first_name || ""
      const lastName = metadata.last_name || ""
      return firstName || lastName ? `${firstName} ${lastName}`.trim() : "No name provided"
    } catch (err) {
      return "Invalid metadata"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Auth Users</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleBalances}>
              {includeBalances ? "Hide Balances" : "Show Balances"}
            </Button>
            <Button variant="outline" onClick={loadUsers}>
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : users.length === 0 ? (
          <div className="text-center py-4">No users found. Try syncing first.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Created At</TableHead>
                  {includeBalances && (
                    <>
                      <TableHead>Balance</TableHead>
                      <TableHead>Loan Balance</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{formatMetadata(user.raw_user_meta_data)}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    {includeBalances && (
                      <>
                        <TableCell>
                          {user.balance !== undefined
                            ? new Intl.NumberFormat("en-NG", {
                                style: "currency",
                                currency: "NGN",
                              }).format(user.balance)
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {user.loan_balance !== undefined
                            ? new Intl.NumberFormat("en-NG", {
                                style: "currency",
                                currency: "NGN",
                              }).format(user.loan_balance)
                            : "N/A"}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
