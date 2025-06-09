import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { verifyJWT } from "@/lib/jwt"

export async function GET(request: NextRequest) {
  try {
    let userId = null
    let authenticated = false

    // Try JWT authentication
    const cookieStore = cookies()
    const jwtToken = cookieStore.get("jwt-token")?.value

    if (jwtToken) {
      const { payload, error } = await verifyJWT(jwtToken)
      if (!error && payload && (payload.sub || payload.userId)) {
        userId = payload.sub || payload.userId
        authenticated = true
      }
    }

    // Try Supabase authentication if JWT failed
    if (!userId) {
      const supabase = createServerClient(cookieStore)
      const { data } = await supabase.auth.getSession()

      if (data.session?.user?.id) {
        userId = data.session.user.id
        authenticated = true
      }
    }

    return NextResponse.json({ authenticated, userId }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ authenticated: false, userId: null }, { status: 500 })
  }
}
