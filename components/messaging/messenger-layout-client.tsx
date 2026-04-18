"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  MoreHorizontal, 
  MessageCircle, 
  Info
} from "lucide-react"
import { ConversationList } from "./conversation-list"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { cn } from "@/lib/utils"

interface Conversation {
  user_id: string
  first_name: string | null
  last_name: string | null
  profile_picture_url: string | null
  last_message: string
  last_message_time: string
  unread_count: number
}

interface MessengerLayoutClientProps {
  currentUserId: string | null
}

export function MessengerLayoutClient({ currentUserId }: MessengerLayoutClientProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Extract userId from search params if we're on a specific conversation
  useEffect(() => {
    const userId = searchParams.get('userId')
    if (userId) {
      setSelectedUserId(userId)
      loadUserProfile(userId)
    } else {
      setSelectedUserId(null)
      setSelectedUserProfile(null)
    }
  }, [searchParams])

  const loadUserProfile = async (userId: string) => {
    try {
      // Use fetch to call the API instead of importing server functions
      const response = await fetch(`/api/user-profile/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedUserProfile(data.profile)
      }
    } catch (error) {
      console.error("Failed to load user profile:", error)
    }
  }

  const handleConversationSelect = (userId: string) => {
    setSelectedUserId(userId)
    router.push(`/messages?userId=${userId}`)
  }

  const filteredConversations = conversations.filter(conversation => {
    const fullName = `${conversation.first_name || ""} ${conversation.last_name || ""}`.trim()
    return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conversation.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getSelectedUserFullName = () => {
    if (!selectedUserProfile) return "Select a conversation"
    return `${selectedUserProfile.first_name || ""} ${selectedUserProfile.last_name || ""}`.trim() || "User"
  }

  const getSelectedUserInitials = () => {
    const fullName = getSelectedUserFullName()
    return fullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Left Sidebar - Conversations */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search Messenger"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-100 border-0 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: "all", label: "All" },
            { id: "unread", label: "Unread" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <ConversationList 
            onConversationSelect={handleConversationSelect}
            selectedUserId={selectedUserId}
            searchQuery={searchQuery}
            activeTab={activeTab}
          />
        </div>
      </div>

      {/* Center - Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedUserId ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {selectedUserProfile?.profile_picture_url ? (
                    <AvatarImage src={selectedUserProfile.profile_picture_url} alt={getSelectedUserFullName()} />
                  ) : (
                    <AvatarFallback className="bg-blue-100">
                      {getSelectedUserInitials()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h2 className="font-semibold text-gray-900">{getSelectedUserFullName()}</h2>
                  <p className="text-sm text-gray-500">Active now</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Link href={selectedUserId ? `/profile/${selectedUserId}` : "#"}>
                    <Info className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
              <MessageList otherUserId={selectedUserId} currentUserId={currentUserId} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200">
              <MessageInput recipientId={selectedUserId} />
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Messages</h2>
              <p className="text-gray-500">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar removed as requested */}
    </div>
  )
}
