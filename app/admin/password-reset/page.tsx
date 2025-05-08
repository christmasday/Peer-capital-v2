"use client"

import { useState } from "react"
import { AdminPasswordResetForm } from "@/components/admin/admin-password-reset-form"
import { UserSearch } from "@/components/admin/user-search"
import { EnsureAdminAuditLogsTableButton } from "@/components/admin/ensure-admin-audit-logs-table-button"
import { AdminAuditLogs } from "@/components/admin/admin-audit-logs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  raw_user_meta_data: any
}

export default function AdminPasswordResetPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Password Management</h1>

      <div className="mb-6">
        <EnsureAdminAuditLogsTableButton />
      </div>

      <Tabs defaultValue="reset">
        <TabsList className="mb-4">
          <TabsTrigger value="reset">Password Reset</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="reset">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <UserSearch onSelectUser={setSelectedUser} />
            </div>

            <div>
              {selectedUser ? (
                <AdminPasswordResetForm userId={selectedUser.id} userEmail={selectedUser.email} />
              ) : (
                <div className="h-full flex items-center justify-center p-6 border rounded-lg bg-muted/10">
                  <p className="text-muted-foreground text-center">
                    Select a user from the list to reset their password
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <AdminAuditLogs />
        </TabsContent>
      </Tabs>
    </div>
  )
}
