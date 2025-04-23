import { NextResponse } from "next/server"
import { syncAuthUsers } from "@/lib/actions/auth-mirror"

// This endpoint can be used to trigger the sync via a cron job or webhook
export async function POST() {
  try {
    const result = await syncAuthUsers()

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${result.count} users`,
    })
  } catch (error) {
    console.error("Error in sync API route:", error)
    return NextResponse.json(
      {
        success: false,
        error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
