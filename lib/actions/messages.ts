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

// Helper function to check if the messages table exists
async function checkTableExists() {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.from("messages").select("id").limit(1)

    if (error && error.code === "42P01") {
      return false
    }

    if (error) {
    }

    return true
  } catch (error) {
    return false
  }
}

// Update the checkUserExistsInAuth function to handle "User not found" errors gracefully
async function checkUserExistsInAuth(userId: string): Promise<boolean> {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.auth.admin.getUserById(userId)

    if (error) {
      // If the error is "User not found", don't treat it as an error, just return false
      if (error.message.includes("User not found")) {
        return false
      }

      return false
    }

    return !!data.user
  } catch (error) {
    return false
  }
}

// Helper function to ensure a profile exists
async function ensureProfileExists(userId: string): Promise<boolean> {
  try {
    const adminClient = createAdminClient()

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (checkError) {
      return false
    }

    if (existingProfile) {
      return true
    }

    // Create profile if it doesn't exist
    const { error: insertError } = await adminClient.from("profiles").insert({
      id: userId,
      first_name: null,
      last_name: null,
      profile_picture_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      return false
    }

    // Verify the profile was created
    const { data: verifyProfile, error: verifyError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (verifyError) {
      return false
    }

    return !!verifyProfile
  } catch (error) {
    return false
  }
}

// Update the createMinimalProfileIfNeeded function to be more flexible
export async function createMinimalProfileIfNeeded(userId: string): Promise<{
  profile?: {
    id: string
    first_name: string | null
    last_name: string | null
    profile_picture_url: string | null
  }
  error?: string
}> {
  try {
    if (!userId) {
      return { error: "User ID is required" }
    }

    // Try to get the existing profile first
    const { profile, error } = await getUserProfileForMessaging(userId)

    // If profile exists, return it immediately
    if (profile) {
      return { profile }
    }

    // If there was an error other than "profile not found", return the error
    if (error && error !== "User profile not found") {
      return { error }
    }

    // Check if the user exists in the auth system
    // But don't block profile creation if they don't
    const userExists = await checkUserExistsInAuth(userId)
    if (!userExists) {
      // Continue anyway - we'll create a profile for messaging purposes
    }

    // Profile doesn't exist, create a minimal one using the admin client to bypass RLS
    const adminClient = createAdminClient()

    // First check if the profile already exists (double-check to avoid race conditions)
    const { data: existingProfile, error: checkError } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name, profile_picture_url")
      .eq("id", userId)
      .maybeSingle()

    if (checkError) {
    } else if (existingProfile) {
      // Profile was created in the meantime, return it
      return { profile: existingProfile }
    }

    // Create the profile using the admin client
    const { data: newProfile, error: insertError } = await adminClient
      .from("profiles")
      .insert({
        id: userId,
        first_name: null,
        last_name: null,
        profile_picture_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id, first_name, last_name, profile_picture_url")
      .single()

    if (insertError) {
      return { error: "Failed to create user profile: " + insertError.message }
    }

    return { profile: newProfile }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { error: "An unexpected error occurred: " + errorMessage }
  }
}

// Update the sendMessage function to handle cases where users don't exist in auth
export async function sendMessage({
  recipientId,
  content,
}: {
  recipientId: string
  content: string
}): Promise<{ success?: boolean; message?: Message; error?: string }> {
  try {
    const tableExists = await checkTableExists()
    if (!tableExists) {
      return { error: "Messages feature is not available yet. Please run the migration first." }
    }

    const senderId = await getCurrentUserId()
    if (!senderId) {
      return { error: "You must be logged in to send messages" }
    }

    if (!recipientId) {
      return { error: "Recipient ID is required" }
    }

    if (!content || content.trim() === "") {
      return { error: "Message content cannot be empty" }
    }


    // CRITICAL: Create profiles BEFORE attempting any other operations
    const senderProfileExists = await ensureProfileExists(senderId)
    if (!senderProfileExists) {
      return { error: "Failed to ensure sender profile exists" }
    }

    const recipientProfileExists = await ensureProfileExists(recipientId)
    if (!recipientProfileExists) {
      return { error: "Failed to ensure recipient profile exists" }
    }


    // Use the admin client to bypass RLS policies
    const adminClient = createAdminClient()

    // Insert message using the admin client
    const { data: message, error } = await adminClient
      .from("messages")
      .insert({
        id: uuidv4(),
        sender_id: senderId,
        recipient_id: recipientId,
        content: content.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single()

    if (error) {
      return { success: false, error: "Failed to send message: " + error.message }
    }


    // Get sender profile for notification data
    const { data: senderProfile } = await adminClient
      .from("profiles")
      .select("first_name, last_name, profile_picture_url")
      .eq("id", senderId)
      .maybeSingle()

    // Create a notification for the recipient
    try {
      // Skip notification creation if we couldn't create the message
      if (!message) {
        throw new Error("Message creation failed")
      }


      // Create the notification with detailed logging
      const notificationResult = await createNotification({
        userId: recipientId,
        type: "message",
        data: {
          messageId: message.id,
          content: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
          senderId: senderId,
          senderName: senderProfile
            ? `${senderProfile.first_name || ""} ${senderProfile.last_name || ""}`.trim()
            : "Someone",
          senderProfilePicture: senderProfile?.profile_picture_url || null,
          timestamp: message.created_at,
        },
      })

      if (!notificationResult.success) {
        // Don't fail the message send if notification fails
      } else {
      }
    } catch (notificationError) {
      // Don't fail the message send if notification fails
    }

    revalidatePath(`/messages/${recipientId}`)
    revalidatePath(`/messages`)

    return { success: true, message }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: "An unexpected error occurred: " + errorMessage }
  }
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
  try {
    const tableExists = await checkTableExists()
    if (!tableExists) {
      return { count: 0 }
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return { count: 0 }
    }

    // Use the admin client to bypass RLS policies
    const adminClient = createAdminClient()

    const { count, error } = await adminClient
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("is_read", false)

    if (error) {
      return { count: 0, error: "Failed to get unread messages count" }
    }

    return { count: count || 0 }
  } catch (error) {
    return { count: 0, error: "An unexpected error occurred" }
  }
}

// Get user profile for messaging
export async function getUserProfileForMessaging(userId: string): Promise<{
  profile?: {
    id: string
    first_name: string | null
    last_name: string | null
    profile_picture_url: string | null
  }
  error?: string
}> {
  try {
    if (!userId) {
      return { error: "User ID is required" }
    }

    // Use the admin client to bypass RLS policies
    const adminClient = createAdminClient()

    // Use maybeSingle() instead of single() to handle the case where no profile is found
    const { data, error } = await adminClient
      .from("profiles")
      .select("id, first_name, last_name, profile_picture_url")
      .eq("id", userId)
      .maybeSingle()

    if (error) {
      return { error: "Failed to fetch user profile" }
    }

    if (!data) {
      return { error: "User profile not found" }
    }

    return { profile: data }
  } catch (error) {
    return { error: "An unexpected error occurred" }
  }
}
