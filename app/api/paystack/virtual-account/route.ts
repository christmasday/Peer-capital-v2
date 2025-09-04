import { NextRequest, NextResponse } from "next/server"
import { createVirtualAccount, getVirtualAccount } from "@/lib/actions/paystack"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    console.log("🔍 GET /api/paystack/virtual-account - User ID:", userId)

    // Get virtual account
    const result = await getVirtualAccount()

    console.log("🏦 getVirtualAccount result:", result)

    if (result.error) {
      console.log("❌ Error in getVirtualAccount:", result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    console.log("✅ Success - returning virtual account:", result.virtualAccount)
    return NextResponse.json({
      success: true,
      virtualAccount: result.virtualAccount
    })
  } catch (error) {
    console.error("❌ Error fetching virtual account:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Create virtual account
    const result = await createVirtualAccount()

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        virtualAccount: result.virtualAccount
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        inProgress: result.inProgress
      })
    }
  } catch (error) {
    console.error("Error creating virtual account:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
