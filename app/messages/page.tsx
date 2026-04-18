import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ConversationList } from "@/components/messaging/conversation-list"
import { Loader2 } from "lucide-react"
import { checkAuth } from "@/lib/auth-utils"
import { MessengerLayoutClient } from "@/components/messaging/messenger-layout-client"
import { getUserProfileForMessaging } from "@/lib/actions/user"
import { getCurrentUserId } from "@/lib/auth-utils"

export default async function MessagesPage() {
  // Use our custom auth check instead of relying solely on Supabase session
  await checkAuth("/login?redirect=/messages")

  // Get current user ID
  const currentUserId = await getCurrentUserId()

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      <MessengerLayoutClient currentUserId={currentUserId} />
    </div>
  )
}
