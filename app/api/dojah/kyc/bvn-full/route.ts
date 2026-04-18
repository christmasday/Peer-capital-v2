import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-utils"

function extractCandidateBvn(payload: any): string | null {
  const raw =
    payload?.entity?.bvn?.bvn ??
    payload?.data?.entity?.bvn?.bvn ??
    payload?.entity?.bvn ??
    payload?.data?.entity?.bvn ??
    payload?.bvn ??
    payload?.data?.bvn ??
    null

  if (raw === null || raw === undefined) return null
  const digits = String(raw).replace(/\D/g, "")
  return digits.length === 11 ? digits : null
}

function isVerifiedDojahResponse(payload: any, inputBvn: string): boolean {
  const status = String(
    payload?.status ?? payload?.data?.status ?? payload?.entity?.status ?? payload?.data?.entity?.status ?? ""
  ).toLowerCase()

  const validFlag =
    payload?.entity?.bvn?.valid ??
    payload?.data?.entity?.bvn?.valid ??
    payload?.entity?.valid ??
    payload?.data?.entity?.valid ??
    payload?.valid ??
    payload?.data?.valid

  const candidateBvn = extractCandidateBvn(payload)
  const bvnMatches = candidateBvn === inputBvn

  const successfulStatus = ["success", "completed", "approved", "valid"].includes(status)
  const explicitlyValid = validFlag === true

  return bvnMatches && (successfulStatus || explicitlyValid)
}

export async function POST(req: NextRequest) {
  try {
    const auth = await checkAuth(true)
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as { bvn?: string }
    const bvn = (body?.bvn || "").toString().trim()

    if (!/^\d{11}$/.test(bvn)) {
      return NextResponse.json({ error: "BVN must be exactly 11 digits" }, { status: 400 })
    }

    const dojahRes = await fetch("https://api.dojah.io/api/v1/kyc/bvn/full", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "AppId": process.env.DOJAH_APP_ID!,
        "Authorization": `Bearer ${process.env.DOJAH_API_KEY}`,
      },
      body: JSON.stringify({ bvn }),
    })

    const dojahData = await dojahRes.json().catch(() => ({}))

    if (!dojahRes.ok) {
      return NextResponse.json(
        { error: dojahData?.error || dojahData?.message || "BVN verification failed", details: dojahData },
        { status: dojahRes.status }
      )
    }

    const verified = isVerifiedDojahResponse(dojahData, bvn)
    if (!verified) {
      return NextResponse.json(
        { error: "Invalid or unverified BVN response", verified: false, details: dojahData },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, verified: true, data: dojahData })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
