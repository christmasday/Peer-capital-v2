"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function updateProfile({
  firstName,
  middleName,
  lastName,
  phoneNumber,
  address,
  city,
  state,
  zipCode,
  profilePictureUrl,
}: {
  firstName: string
  middleName?: string
  lastName: string
  phoneNumber: string
  address: string
  city: string
  state: string
  zipCode?: string
  profilePictureUrl?: string | null
}) {
  try {
    const supabase = createServerClient()
    const adminClient = createAdminClient()

    // Get the current user
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      return { error: "You must be logged in to update your profile" }
    }

    const userId = sessionData.session.user.id

    // Update the profile using admin client to bypass RLS
    const { error } = await adminClient
      .from("profiles")
      .update({
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        phone_number: phoneNumber,
        address: address,
        city: city,
        state: state,
        zip_code: zipCode || null,
        profile_picture_url: profilePictureUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("Error updating profile:", error)
      return { error: error.message }
    }

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error updating profile:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function uploadProfilePicture(file: File) {
  try {
    const supabase = createServerClient()
    const adminClient = createAdminClient()

    // Get the current user
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      return { error: "You must be logged in to upload a profile picture" }
    }

    // Generate a unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${sessionData.session.user.id}-${Date.now()}.${fileExt}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload the file using admin client to bypass RLS
    const { error: uploadError, data } = await adminClient.storage.from("profiles").upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    })

    if (uploadError) {
      console.error("Error uploading profile picture:", uploadError)
      return { error: uploadError.message }
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = adminClient.storage.from("profiles").getPublicUrl(fileName)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error("Unexpected error uploading profile picture:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
