import { type NextRequest, NextResponse } from "next/server"
import { refreshJWT } from "@/lib/actions/auth"
import { JWT_COOKIE_NAME } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    // Get the current JWT from the cookie
    const currentToken = request.cookies.get(JWT_COOKIE_NAME)?.value

    if (!currentToken) {
      return NextResponse.json({ error: "No authentication token found" }, { status: 401 })
    }

    // Attempt to refresh the token
    const result = await refreshJWT(currentToken)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      refreshed: result.refreshed,
    })
  } catch (error) {
    console.error("Error in refresh token API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
