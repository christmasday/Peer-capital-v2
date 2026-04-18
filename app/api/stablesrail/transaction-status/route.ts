import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-utils"

/**
 * @deprecated Use /api/stablesrail/cngn-request-status instead.
 * This endpoint is kept for backward compatibility and proxies to the canonical endpoint.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await checkAuth(true)
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const correlationId = searchParams.get("correlationId")
    if (!correlationId) {
      return NextResponse.json({ error: "correlationId is required" }, { status: 400 })
    }

    // Proxy to the canonical cngn-request-status endpoint
    const canonicalUrl = new URL("/api/stablesrail/cngn-request-status", req.url)
    canonicalUrl.searchParams.set("correlationId", correlationId)

    // Forward cookies for auth
    const response = await fetch(canonicalUrl.toString(), {
      headers: { cookie: req.headers.get("cookie") || "" },
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Error in transaction-status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
