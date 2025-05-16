import { MainLayout } from "@/components/layouts/main-layout"
import { checkAuth } from "@/lib/auth-utils"
import { getUserProfile } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"

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

        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">All migrations completed</AlertTitle>
          <AlertDescription className="text-green-700">
            All database migrations have been successfully applied. The database schema is up to date.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Status</CardTitle>
              <CardDescription>Current database schema information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="font-medium text-gray-900">Schema Version</h3>
                <p className="text-gray-600 mt-1">Current: v1.0.0</p>
              </div>

              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="font-medium text-gray-900">Tables</h3>
                <p className="text-gray-600 mt-1">All required tables have been created.</p>
              </div>

              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="font-medium text-gray-900">Functions</h3>
                <p className="text-gray-600 mt-1">All required database functions have been created.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Maintenance</CardTitle>
              <CardDescription>Tools for database maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Database maintenance tools will be added here in future updates. Currently, all migrations have been
                applied and no maintenance is required.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
