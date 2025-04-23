import { createAdminClient } from "@/lib/supabase/admin"
import { SyncAuthUsersButton } from "@/components/sync-auth-users-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"

export default async function AuthUsersPage() {
  const adminClient = createAdminClient()

  // Get users from our custom auth table
  const { data: users, error } = await adminClient
    .from("auth_users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Auth Users Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Sync Users</CardTitle>
              <CardDescription>Sync users from Supabase Auth to the custom auth_users table</CardDescription>
            </CardHeader>
            <CardContent>
              <SyncAuthUsersButton />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Custom Auth Users</CardTitle>
              <CardDescription>Users in the public.auth_users table</CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-red-500">Error loading users: {error.message}</div>
              ) : !users || users.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No users found in the custom auth table</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Last Sign In</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-xs">{user.id.substring(0, 8)}...</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "N/A"}
                          </TableCell>
                          <TableCell>
                            {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), "MMM d, yyyy") : "Never"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
