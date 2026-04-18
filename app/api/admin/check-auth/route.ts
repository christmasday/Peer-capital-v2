import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    
    if (!authResult.authenticated) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true, 
      isAdmin: authResult.isAdmin,
      authenticated: authResult.authenticated
    })
  } catch (error) {
    console.error("Admin auth check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
