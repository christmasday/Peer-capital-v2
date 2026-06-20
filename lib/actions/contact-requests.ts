"use server"

import { getCurrentUserId } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { createNotification } from "@/lib/actions/notifications"
import { executeContactsMigration } from "@/lib/actions/execute-contacts-migration"

type ContactStatus = "none" | "pending_sent" | "pending_received" | "accepted" | "rejected"

export async function ensureContactsTable() {
  const result = await executeContactsMigration()
  if (!result.success) {
    console.warn("Contacts migration warning:", result.error)
  }
}

async function getProfileName(userId: string) {
  const adminClient = createAdminClient()
  const { data } = await adminClient.from("profiles").select("first_name, last_name, profile_picture_url").eq("id", userId).single()
  if (!data) return { name: "Someone", avatarUrl: null }
  return {
    name: [data.first_name, data.last_name].filter(Boolean).join(" ") || "Someone",
    avatarUrl: data.profile_picture_url,
  }
}

export async function getContactStatus(targetUserId: string): Promise<{ success: boolean; status?: ContactStatus | "self"; requestId?: string; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Not authenticated" }
  if (userId === targetUserId) return { success: true, status: "self" }

  const adminClient = createAdminClient()

  const { data: sent } = await adminClient
    .from("contacts")
    .select("id, status")
    .eq("requester_id", userId)
    .eq("addressee_id", targetUserId)
    .single()

  if (sent) {
    if (sent.status === "accepted") return { success: true, status: "accepted", requestId: sent.id }
    if (sent.status === "pending") return { success: true, status: "pending_sent", requestId: sent.id }
    if (sent.status === "rejected") return { success: true, status: "rejected", requestId: sent.id }
  }

  const { data: received } = await adminClient
    .from("contacts")
    .select("id, status")
    .eq("requester_id", targetUserId)
    .eq("addressee_id", userId)
    .single()

  if (received) {
    if (received.status === "accepted") return { success: true, status: "accepted", requestId: received.id }
    if (received.status === "pending") return { success: true, status: "pending_received", requestId: received.id }
    if (received.status === "rejected") return { success: true, status: "rejected", requestId: received.id }
  }

  return { success: true, status: "none" }
}

export async function sendContactRequest(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Not authenticated" }

  await ensureContactsTable()

  const adminClient = createAdminClient()

  const existing = await getContactStatus(targetUserId)
  if (!existing.success) return { success: false, error: existing.error }
  if (existing.status !== "none" && existing.status !== "rejected") {
    return { success: false, error: "Contact request already exists" }
  }

  const { data: inserted, error } = await adminClient.from("contacts").insert({
    requester_id: userId,
    addressee_id: targetUserId,
    status: "pending",
  }).select("id").single()

  if (error || !inserted) return { success: false, error: error?.message || "Failed to create contact request" }

  const requesterProfile = await getProfileName(userId)

  await createNotification({
    userId: targetUserId,
    type: "connection_request",
    content: `${requesterProfile.name} wants to add you as a contact.`,
    data: {
      requesterId: userId,
      requestId: inserted.id,
      requesterName: requesterProfile.name,
      requesterProfilePicture: requesterProfile.avatarUrl,
    },
  })

  return { success: true }
}

export async function acceptContactRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Not authenticated" }

  const adminClient = createAdminClient()

  const { data: request } = await adminClient
    .from("contacts")
    .select("*")
    .eq("id", requestId)
    .single()

  if (!request) return { success: false, error: "Contact request not found" }
  if (request.addressee_id !== userId) return { success: false, error: "Not authorized" }
  if (request.status !== "pending") return { success: false, error: "Request is no longer pending" }

  const { error } = await adminClient
    .from("contacts")
    .update({ status: "accepted" })
    .eq("id", requestId)

  if (error) return { success: false, error: error.message }

  const acceptorProfile = await getProfileName(userId)

  await createNotification({
    userId: request.requester_id,
    type: "connection_accepted",
    content: `${acceptorProfile.name} accepted your contact request.`,
    data: {
      acceptorId: userId,
      acceptorName: acceptorProfile.name,
      acceptorProfilePicture: acceptorProfile.avatarUrl,
    },
  })

  return { success: true }
}

export async function rejectContactRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Not authenticated" }

  const adminClient = createAdminClient()

  const { data: request } = await adminClient
    .from("contacts")
    .select("*")
    .eq("id", requestId)
    .single()

  if (!request) return { success: false, error: "Contact request not found" }
  if (request.addressee_id !== userId) return { success: false, error: "Not authorized" }
  if (request.status !== "pending") return { success: false, error: "Request is no longer pending" }

  const { error } = await adminClient
    .from("contacts")
    .update({ status: "rejected" })
    .eq("id", requestId)

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function getPendingRequests() {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Not authenticated" }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from("contacts")
    .select("id, requester_id, created_at")
    .eq("addressee_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) return { success: false, error: error.message }

  const profiles = await Promise.all(
    (data || []).map(async (item) => {
      const profile = await getProfileName(item.requester_id)
      return { id: item.id, requesterId: item.requester_id, requesterName: profile.name, requesterAvatar: profile.avatarUrl, createdAt: item.created_at }
    })
  )

  return { success: true, requests: profiles }
}

export async function getContacts() {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Not authenticated" }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from("contacts")
    .select("*")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq("status", "accepted")
    .order("created_at", { ascending: false })

  if (error) return { success: false, error: error.message }

  const contactUserIds = (data || []).map((item) =>
    item.requester_id === userId ? item.addressee_id : item.requester_id
  )

  if (contactUserIds.length === 0) {
    return { success: true, contacts: [] }
  }

  const { data: profiles, error: profilesError } = await adminClient
    .from("profiles")
    .select("id, first_name, last_name, username, profile_picture_url, bio, job_title, employer_name")
    .in("id", contactUserIds)

  if (profilesError) return { success: false, error: profilesError.message }

  const { data: loanGoals } = await adminClient
    .from("loan_helpers")
    .select("user_id, loan_amount, interest_rate, repayment_time, repayment_unit")
    .in("user_id", contactUserIds)
    .eq("is_active", true)

  const loanGoalsByUser = new Map<string, any>()
  for (const goal of loanGoals || []) {
    loanGoalsByUser.set(goal.user_id, {
      loan_amount: goal.loan_amount,
      interest_rate: goal.interest_rate,
      repayment_time: goal.repayment_time,
      repayment_unit: goal.repayment_unit,
    })
  }

  const contactProfiles = (profiles || []).map((p) => ({
    ...p,
    loan_goal: loanGoalsByUser.get(p.id) || null,
  }))

  return { success: true, contacts: contactProfiles }
}
