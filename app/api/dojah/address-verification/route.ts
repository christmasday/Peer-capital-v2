import { NextResponse } from "next/server"
import { createAdminClient } from "../../../../lib/supabase/admin"
import { createServerClient } from "../../../../lib/supabase/server"
import { getDojahApiUrl, getDojahSecretKey } from "../../../../lib/dojah"

function normalizeText(value: unknown) {
  return String(value || "").trim()
}

async function fetchVerifiedAddress(referenceId: string, appId: string, secretKey: string) {
  const url = new URL(getDojahApiUrl("/api/v1/kyc/address"))
  url.searchParams.set("reference_id", referenceId)

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      AppId: appId,
      Authorization: secretKey,
    },
  })

  return response.json().catch(() => ({}))
}

export async function POST() {
  try {
    const supabase = await createServerClient()
    const adminClient = createAdminClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, first_name, middle_name, last_name, phone_number, date_of_birth, address, street, lga, city, state, landmark")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const firstName = normalizeText(profile.first_name)
    const lastName = normalizeText(profile.last_name)
    const mobile = normalizeText(profile.phone_number)
    const street = normalizeText(profile.street || profile.address)
    const lga = normalizeText(profile.lga || profile.city)
    const state = normalizeText(profile.state)

    if (!firstName || !lastName || !mobile || !street || !lga || !state) {
      return NextResponse.json(
        {
          error:
            "Complete your first name, last name, phone number, street, LGA, and state before verifying your address.",
        },
        { status: 400 }
      )
    }

    const appId = process.env.DOJAH_APP_ID || process.env.NEXT_PUBLIC_DOJAH_APP_ID || ""
    const secretKey = getDojahSecretKey()

    if (!appId || !secretKey) {
      return NextResponse.json({ error: "Dojah credentials are not configured" }, { status: 500 })
    }

    const submitResponse = await fetch(getDojahApiUrl("/api/v1/kyc/address"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        AppId: appId,
        Authorization: secretKey,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        middle_name: normalizeText(profile.middle_name) || undefined,
        dob: normalizeText(profile.date_of_birth) || undefined,
        mobile,
        street,
        landmark: normalizeText(profile.landmark) || undefined,
        lga,
        state,
      }),
    })

    const submitData = await submitResponse.json().catch(() => ({}))
    if (!submitResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: submitData?.error || submitData?.message || "Address verification failed",
          dojahResponse: submitData,
        },
        { status: submitResponse.status }
      )
    }

    const referenceId = submitData?.entity?.reference_id || submitData?.reference_id || null
    let finalStatus = String(submitData?.entity?.status || submitData?.status || "pending")
    let dojahResponse = submitData

    if (referenceId) {
      const fetchedData = await fetchVerifiedAddress(referenceId, appId, secretKey)
      if (fetchedData && Object.keys(fetchedData).length > 0) {
        dojahResponse = fetchedData
        finalStatus = String(fetchedData?.entity?.status || finalStatus || "pending")
      }
    }

    const verified = finalStatus === "completed"
    const persistedAt = verified ? new Date().toISOString() : null

    await adminClient
      .from("profiles")
      .update({
        address_verification_status: finalStatus,
        address_verification_reference_id: referenceId,
        address_verified: verified,
        address_verified_at: persistedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    return NextResponse.json({
      success: true,
      verified,
      status: finalStatus,
      referenceId,
      dojahResponse,
    })
  } catch (error) {
    console.error("Error verifying Dojah address:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}