import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/auth-utils"
import { getUserProfile } from "@/lib/actions/auth"

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const userProfile = await getUserProfile()
    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: userProfile.user,
      profile: userProfile.profile,
      account: userProfile.account
    })

  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
