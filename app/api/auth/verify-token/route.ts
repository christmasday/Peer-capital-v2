import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const { payload, error } = await verifyJWT(token)

    if (error || !payload) {
      return NextResponse.json({ valid: false }, { status: 200 })
    }

    return NextResponse.json({ valid: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}
