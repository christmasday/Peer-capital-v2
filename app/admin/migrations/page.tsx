import ExecuteConnectionMigrationButton from "@/components/admin/execute-connection-migration-button"
import FixConnectionForeignKeysButton from "@/components/admin/fix-connection-foreign-keys-button"
import ExecuteNotificationsMigrationButton from "@/components/admin/execute-notifications-migration-button"
import FixNotificationsSchemaButton from "@/components/admin/fix-notifications-schema-button"
import CreateCheckTableExistsFunctionButton from "@/components/admin/create-check-table-exists-function-button"
import CreateExecuteSqlFunctionButton from "@/components/admin/create-execute-sql-function-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MigrationsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Database Migrations</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Utility Functions</CardTitle>
            <CardDescription>Create utility functions for database operations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CreateExecuteSqlFunctionButton />
            <CreateCheckTableExistsFunctionButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Connections</CardTitle>
            <CardDescription>Create the user_connections table to enable following functionality.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExecuteConnectionMigrationButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fix Connection Foreign Keys</CardTitle>
            <CardDescription>Fix foreign key constraints on the user_connections table.</CardDescription>
          </CardHeader>
          <CardContent>
            <FixConnectionForeignKeysButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Create the notifications table to enable user notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExecuteNotificationsMigrationButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fix Notifications Schema</CardTitle>
            <CardDescription>Fix the schema of the notifications table if columns are missing.</CardDescription>
          </CardHeader>
          <CardContent>
            <FixNotificationsSchemaButton />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
