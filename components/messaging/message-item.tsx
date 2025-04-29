"use client"

import type { MessageWithProfile } from "@/lib/actions/messages"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserRound } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface MessageItemProps {
  message: MessageWithProfile
  currentUserId: string
}

export function MessageItem({ message, currentUserId }: MessageItemProps) {
  const isOwnMessage = message.sender_id === currentUserId
  const profile = isOwnMessage ? message.recipient : message.sender
  const fullName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "User"
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className={cn("flex items-start gap-2 mb-4", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="h-8 w-8 mt-1">
        {profile?.profile_picture_url ? (
          <AvatarImage src={profile.profile_picture_url || "/placeholder.svg"} alt={fullName} />
        ) : (
          <AvatarFallback className="bg-blue-100">
            {initials || <UserRound className="h-4 w-4 text-blue-500" />}
          </AvatarFallback>
        )}
      </Avatar>

      <div className="flex flex-col max-w-[75%]">
        <div
          className={cn(
            "px-4 py-2 rounded-lg",
            isOwnMessage ? "bg-blue-500 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span className="text-xs text-gray-500 mt-1 self-start">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  )
}
