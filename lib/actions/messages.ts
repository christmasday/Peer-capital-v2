"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { getCurrentUserId } from "@/lib/auth-utils"
import { createNotification } from "./notifications"

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

// The rest of the file remains unchanged
export async function getConversations(): Promise<{
  conversations?: Array<{
    user_id: string
    first_name: string | null
    last_name: string | null
    profile_picture_url: string | null
    last_message: string
    last_message_time: string
    unread_count: number
  }>
  error?: string
}> {
  try {
    const tableExists = await checkTableExists()
    if (!tableExists) {
      return { conversations: [] }
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return { error: "Authentication required. Please log in to view your conversations." }
    }

    // Use the admin client to bypass RLS policies
    const adminClient = createAdminClient()

    // Get all users you've messaged with or who have messaged you
    const { data: sentMessages, error: sentError } = await adminClient
      .from("messages")
      .select("recipient_id, content, created_at, is_read")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false })

    const { data: receivedMessages, error: receivedError } = await adminClient
      .from("messages")
      .select("sender_id, content, created_at, is_read")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })

    if (sentError || receivedError) {
      return { error: "Failed to fetch conversations" }
    }

    // Combine and process the messages to get unique conversations
    const conversationMap = new Map<
      string,
      {
        user_id: string
        last_message: string
        last_message_time: string
        unread_count: number
      }
    >()

    // Process sent messages
    sentMessages?.forEach((message) => {
      const userId = message.recipient_id
      const existingConversation = conversationMap.get(userId)

      if (!existingConversation || new Date(message.created_at) > new Date(existingConversation.last_message_time)) {
        conversationMap.set(userId, {
          user_id: userId,
          last_message: message.content,
          last_message_time: message.created_at,
          unread_count: 0, // You sent these, so they're not unread for you
        })
      }
    })

    // Process received messages
    receivedMessages?.forEach((message) => {
      const userId = message.sender_id
      const existingConversation = conversationMap.get(userId)
      const messageTime = new Date(message.created_at)

      if (!existingConversation) {
        conversationMap.set(userId, {
          user_id: userId,
          last_message: message.content,
          last_message_time: message.created_at,
          unread_count: message.is_read ? 0 : 1,
        })
      } else {
        // Update if this message is more recent
        if (messageTime > new Date(existingConversation.last_message_time)) {
          existingConversation.last_message = message.content
          existingConversation.last_message_time = message.created_at
        }

        // Increment unread count if this message is unread
        if (!message.is_read) {
          existingConversation.unread_count += 1
        }
      }
    })

    // Get user profiles for all conversation partners
    const userIds = Array.from(conversationMap.keys())
    if (userIds.length === 0) {
      return { conversations: [] }
    }

    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name, profile_picture_url")
      .in("id", userIds)

    if (profilesError) {
      return { error: "Failed to fetch user profiles" }
    }

    // Combine conversation data with profiles
    const conversations = userIds.map((userId) => {
      const conversation = conversationMap.get(userId)!
      const profile = profiles?.find((p) => p.id === userId)

      return {
        user_id: userId,
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        profile_picture_url: profile?.profile_picture_url || null,
        last_message: conversation.last_message,
        last_message_time: conversation.last_message_time,
        unread_count: conversation.unread_count,
      }
    })

    // Sort by most recent message
    conversations.sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime())

    return { conversations }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
    return { error: `Failed to load conversations: ${errorMessage}` }
  }
}

export async function getMessages(
  otherUserId: string,
  page = 1,
  limit = 50,
): Promise<{ messages?: MessageWithProfile[]; hasMore?: boolean; error?: string }> {
  try {
    const tableExists = await checkTableExists()
    if (!tableExists) {
      return { messages: [] }
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return { error: "You must be logged in to view messages" }
    }

    // Use the admin client to bypass RLS policies
    const adminClient = createAdminClient()
    const offset = (page - 1) * limit

    // Get messages between the two users without using foreign key relationships
    const {
      data: messagesData,
      error: messagesError,
      count,
    } = await adminClient
      .from("messages")
      .select("*", { count: "exact" })
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`,
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (messagesError) {
      return { error: "Failed to fetch messages" }
    }

    // Mark messages as read if they were sent to the current user
    const unreadMessageIds = messagesData
      ?.filter((message) => message.recipient_id === userId && !message.is_read)
      .map((message) => message.id)

    if (unreadMessageIds && unreadMessageIds.length > 0) {
      const { error: updateError } = await adminClient
        .from("messages")
        .update({ is_read: true })
        .in("id", unreadMessageIds)

      if (updateError) {
      }
    }

    // Get all unique user IDs from the messages
    const userIds = Array.from(
      new Set(messagesData?.flatMap((message) => [message.sender_id, message.recipient_id]) || []),
    )

    // Fetch profiles for all users involved in the messages
    const { data: profilesData, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name, profile_picture_url")
      .in("id", userIds)

    if (profilesError) {
      return { error: "Failed to fetch user profiles" }
    }

    // Create a map of user IDs to profiles for easy lookup
    const profilesMap = new Map(profilesData?.map((profile) => [profile.id, profile]) || [])

    // Process messages to include profile data
    const processedMessages = messagesData?.map((message) => {
      const senderProfile = profilesMap.get(message.sender_id)
      const recipientProfile = profilesMap.get(message.recipient_id)

      return {
        id: message.id,
        sender_id: message.sender_id,
        recipient_id: message.recipient_id,
        content: message.content,
        is_read: message.is_read,
        created_at: message.created_at,
        updated_at: message.updated_at,
        sender: {
          first_name: senderProfile?.first_name || null,
          last_name: senderProfile?.last_name || null,
          profile_picture_url: senderProfile?.profile_picture_url || null,
        },
        recipient: {
          first_name: recipientProfile?.first_name || null,
          last_name: recipientProfile?.last_name || null,
          profile_picture_url: recipientProfile?.profile_picture_url || null,
        },
      }
    })

    return {
      messages: processedMessages as MessageWithProfile[],
      hasMore: count ? offset + limit < count : false,
    }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}

export async function getUnreadMessagesCount(): Promise<{ count: number; error?: string }> {
  return { count: 0 }
}

export async function getUserProfileForMessaging(_userId: string): Promise<{ profile?: { id: string; first_name: string | null; last_name: string | null; profile_picture_url: string | null }; error?: string }> {
  return { error: "Messaging disabled" }
}

