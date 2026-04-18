import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/auth-utils"
import { isStaffMember } from "@/lib/role-utils"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { isStaff: false },
        { status: 200 }
      )
    }

    // Check if user is staff
    const staffStatus = await isStaffMember(userId)

    return NextResponse.json({
      isStaff: staffStatus
    })

  } catch (error) {
    console.error("Error checking staff status:", error)
    return NextResponse.json(
      { isStaff: false },
      { status: 200 }
    )
  }
}
