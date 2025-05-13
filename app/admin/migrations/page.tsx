import { MainLayout } from "@/components/layouts/main-layout"
import { checkAuth } from "@/lib/auth-utils"
import { getUserProfile } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateExecuteSqlFunctionButton } from "@/components/admin/create-execute-sql-function-button"
import { CreateCheckTableExistsFunctionButton } from "@/components/admin/create-check-table-exists-function-button"
import { CreatePasswordResetTokensTableButton } from "@/components/admin/create-password-reset-tokens-table-button"
import { ExecuteConnectionMigrationButton } from "@/components/admin/execute-connection-migration-button"
import { FixConnectionForeignKeysButton } from "@/components/admin/fix-connection-foreign-keys-button"
import { ExecuteNotificationsMigrationButton } from "@/components/admin/execute-notifications-migration-button"
import { FixNotificationsSchemaButton } from "@/components/admin/fix-notifications-schema-button"
import { CreateMessagesTableButton } from "@/components/admin/create-messages-table-button"
import { CreateVirtualAccountsTableButton } from "@/components/admin/create-virtual-accounts-table-button"
import { UpdateVirtualAccountsTableButton } from "@/components/admin/update-virtual-accounts-table-button"
import { CreateWebhookEventsTableButton } from "@/components/admin/create-webhook-events-table-button"
import { AddActivityNotificationPreferencesButton } from "@/components/admin/add-activity-notification-preferences-button"

export const dynamic = "force-dynamic"

export default async function AdminMigrationsPage() {
  // Check authentication
  await checkAuth()

  // Get user profile
  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect("/login")
  }

  // Check if user is admin
  const isAdmin = userProfile.user?.app_metadata?.is_admin || false

  if (!isAdmin) {
    redirect("/dashboard")
  }

  return (
    <MainLayout
      userName={userProfile.profile?.first_name || "Admin"}
      userImage={userProfile.profile?.profile_picture_url || "/vibrant-street-market.png"}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Database Migrations</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Core Functions</CardTitle>
              <CardDescription>Create essential database functions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CreateExecuteSqlFunctionButton />
              <CreateCheckTableExistsFunctionButton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>Authentication related tables</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CreatePasswordResetTokensTableButton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Connections</CardTitle>
              <CardDescription>User connections and relationships</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExecuteConnectionMigrationButton />
              <FixConnectionForeignKeysButton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Notification system tables</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExecuteNotificationsMigrationButton />
              <FixNotificationsSchemaButton />
              <AddActivityNotificationPreferencesButton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Messaging</CardTitle>
              <CardDescription>Messaging system tables</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CreateMessagesTableButton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Virtual Accounts</CardTitle>
              <CardDescription>Virtual accounts and payment processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CreateVirtualAccountsTableButton />
              <UpdateVirtualAccountsTableButton />
              <CreateWebhookEventsTableButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
