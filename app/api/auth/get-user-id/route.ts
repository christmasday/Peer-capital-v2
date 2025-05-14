import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ userId: null }, { status: 400 })
    }

    const { payload, error } = await verifyJWT(token)

    if (error || !payload) {
      return NextResponse.json({ userId: null }, { status: 200 })
    }

    const userId = payload.sub || payload.userId

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ userId: null }, { status: 200 })
    }

    return NextResponse.json({ userId }, { status: 200 })
  } catch (error) {
    console.error("Error getting user ID from token:", error)
    return NextResponse.json({ userId: null }, { status: 500 })
  }
}
