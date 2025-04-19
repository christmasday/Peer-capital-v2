import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This middleware is intentionally disabled to troubleshoot authentication issues
export async function middleware(req: NextRequest) {
  console.log("Middleware disabled for troubleshooting - allowing all requests")
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match nothing - effectively disabling the middleware
    "/_disabled_middleware_path_that_doesnt_exist",
  ],
}
