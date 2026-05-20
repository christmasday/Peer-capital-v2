"use server"

// Messaging feature removed from UI. Export lightweight no-op implementations
// so server code depending on these functions continues to work without errors.

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface MessageWithProfile extends Message {
  sender?: {
    first_name: string | null
    last_name: string | null
    profile_picture_url: string | null
  }
  recipient?: {
    first_name: string | null
    last_name: string | null
    profile_picture_url: string | null
  }
}

export async function createMinimalProfileIfNeeded(userId: string): Promise<{
  profile?: { id: string; first_name: string | null; last_name: string | null; profile_picture_url: string | null }
  error?: string
}> {
  return { profile: undefined }
}

export async function sendMessage({ recipientId, content }: { recipientId: string; content: string }): Promise<{ success?: boolean; message?: Message; error?: string }> {
  return { success: false, error: "Messaging has been disabled" }
}

export async function getConversations(): Promise<{ conversations?: Array<{ user_id: string; first_name: string | null; last_name: string | null; profile_picture_url: string | null; last_message: string; last_message_time: string; unread_count: number }>; error?: string }> {
  return { conversations: [] }
}

export async function getMessages(_otherUserId: string, _page = 1, _limit = 50): Promise<{ messages?: MessageWithProfile[]; hasMore?: boolean; error?: string }> {
  return { messages: [], hasMore: false }
}

export async function getUnreadMessagesCount(): Promise<{ count: number; error?: string }> {
  return { count: 0 }
}

export async function getUserProfileForMessaging(_userId: string): Promise<{ profile?: { id: string; first_name: string | null; last_name: string | null; profile_picture_url: string | null }; error?: string }> {
  return { error: "Messaging disabled" }
}

