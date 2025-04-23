import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { TestNav } from "./components/test-nav"

export default function TestIndexPage() {
  return (
    <div className="container mx-auto py-10">
      <TestNav />

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Authentication Test Suite</CardTitle>
          <CardDescription>A collection of test pages to verify authentication functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/test/signin">
              <Card className="p-4 h-full hover:bg-gray-50 transition-colors cursor-pointer">
                <h3 className="text-lg font-medium mb-2">Sign In Test</h3>
                <p className="text-sm text-gray-500">Test the sign-in process with real credentials</p>
              </Card>
            </Link>

            <Link href="/test/logout">
              <Card className="p-4 h-full hover:bg-gray-50 transition-colors cursor-pointer">
                <h3 className="text-lg font-medium mb-2">Logout Test</h3>
                <p className="text-sm text-gray-500">Test if logout properly clears all authentication data</p>
              </Card>
            </Link>

            <Link href="/test/middleware">
              <Card className="p-4 h-full hover:bg-gray-50 transition-colors cursor-pointer">
                <h3 className="text-lg font-medium mb-2">Middleware Test</h3>
                <p className="text-sm text-gray-500">View authentication data used by the middleware</p>
              </Card>
            </Link>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
            <h3 className="text-lg font-medium text-blue-800 mb-2">How to use these tests</h3>
            <ol className="list-decimal ml-5 space-y-2 text-blue-700">
              <li>
                Use the <strong>Sign In Test</strong> to test the login process
              </li>
              <li>
                Use the <strong>Logout Test</strong> to verify logout functionality with different auth methods
              </li>
              <li>
                Use the <strong>Middleware Test</strong> to see what authentication data is available to the middleware
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
