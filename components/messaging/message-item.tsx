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
    <div className={cn("flex items-end gap-2 mb-2", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
      {!isOwnMessage && (
        <Avatar className="h-6 w-6 mb-1">
          {profile?.profile_picture_url ? (
            <AvatarImage src={profile.profile_picture_url || "/placeholder.svg"} alt={fullName} />
          ) : (
            <AvatarFallback className="bg-blue-100 text-xs">
              {initials || <UserRound className="h-3 w-3 text-blue-500" />}
            </AvatarFallback>
          )}
        </Avatar>
      )}

      <div className={cn("flex flex-col max-w-[70%]", isOwnMessage ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-3 py-2 rounded-2xl text-sm",
            isOwnMessage 
              ? "bg-blue-500 text-white rounded-br-md" 
              : "bg-gray-200 text-gray-900 rounded-bl-md"
          )}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        </div>
        <span className={cn(
          "text-xs text-gray-500 mt-1 px-1",
          isOwnMessage ? "text-right" : "text-left"
        )}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </span>
      </div>

      {isOwnMessage && (
        <div className="w-6" /> // Spacer to align with other messages
      )}
    </div>
  )
}
