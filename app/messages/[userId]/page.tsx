import { redirect } from "next/navigation"
import { getCurrentUserId } from "@/lib/auth-utils"

export default async function ConversationPage({ params }: { params: { userId: string } }) {
  const { userId } = params

  if (!userId || userId.trim() === "") {
    redirect("/messages")
  }

  // Get the current user ID
  const currentUserId = await getCurrentUserId()
  if (!currentUserId) {
    redirect("/login?redirect=" + encodeURIComponent(`/messages/${userId}`))
  }

  // Don't allow messaging yourself
  if (userId === currentUserId) {
    redirect("/messages")
  }

  // Redirect to the main messages page - the MessengerLayout will handle the conversation selection
  redirect("/messages")
}
