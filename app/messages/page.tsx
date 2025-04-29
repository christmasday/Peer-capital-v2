import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConversationList } from "@/components/messaging/conversation-list"
import { Loader2 } from "lucide-react"
import { checkAuth } from "@/lib/auth-utils"

export default async function MessagesPage() {
  // Use our custom auth check instead of relying solely on Supabase session
  await checkAuth("/login?redirect=/messages")

  return (
    <div className="container max-w-5xl py-8">
      <Card className="h-[calc(100vh-8rem)]">
        <CardHeader className="border-b">
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            }
          >
            <ConversationList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
