import { redirect } from "next/navigation"
import { MessageList } from "@/components/messaging/message-list"
import { MessageInput } from "@/components/messaging/message-input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserRound, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getCurrentUserId } from "@/lib/auth-utils"
import { getUserProfileForMessaging } from "@/lib/actions/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  // Check if the user exists in the profiles table
  const { profile, error } = await getUserProfileForMessaging(userId)

  // If there's an error or the profile doesn't exist, show a friendly message
  if (error || !profile) {
    return (
      <div className="container max-w-5xl py-8">
        <Card className="h-[calc(100vh-8rem)]">
          <CardHeader className="border-b py-4">
            <div className="flex items-center">
              <Link href="/messages" className="mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <CardTitle>User Not Found</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[calc(100%-4rem)]">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                The user you're trying to message doesn't exist or has been deleted.
              </p>
              <Link href="/messages" className="text-primary hover:underline">
                Return to Messages
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User"
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="container max-w-5xl py-8">
      <Card className="h-[calc(100vh-8rem)]">
        <CardHeader className="border-b py-4">
          <div className="flex items-center">
            <Link href="/messages" className="mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Avatar className="h-10 w-10 mr-3">
              {profile.profile_picture_url ? (
                <AvatarImage src={profile.profile_picture_url || "/placeholder.svg"} alt={fullName} />
              ) : (
                <AvatarFallback className="bg-blue-100">
                  {initials || <UserRound className="h-5 w-5 text-blue-500" />}
                </AvatarFallback>
              )}
            </Avatar>
            <CardTitle>{fullName}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col h-[calc(100%-4rem)]">
          <div className="flex-1 overflow-hidden">
            <MessageList otherUserId={userId} currentUserId={currentUserId} />
          </div>
          <MessageInput recipientId={userId} onMessageSent={() => {}} />
        </CardContent>
      </Card>
    </div>
  )
}
