import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "./jwt"

// Protected routes that require authentication
const protectedRoutes = ["/home", "/profile", "/loans", "/transactions"]

// Public routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/forgot-password"]

// This function can be used in middleware.ts when ready to re-enable
export async function authMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => path === route || path.startsWith(`${route}/`))

  // Check if the path is a public route
  const isPublicRoute = publicRoutes.some((route) => path === route || path.startsWith(`${route}/`))

  // Skip middleware for non-matched routes (like static assets)
  if (!isProtectedRoute && !isPublicRoute) {
    return NextResponse.next()
  }

  // Get JWT from cookies
  const jwt = req.cookies.get("auth-token")?.value

  // For protected routes, verify JWT
  if (isProtectedRoute) {
    // If no JWT, redirect to login
    if (!jwt) {
      // Check for bypass parameter to prevent redirect loops
      const hasAuthBypass = req.nextUrl.searchParams.get("auth") === "direct"
      if (hasAuthBypass) {
        return NextResponse.next()
      }

      return NextResponse.redirect(new URL("/?redirect=true", req.url))
    }

    // Verify JWT
    const { payload, error } = await verifyJWT(jwt)

    // If JWT is invalid, redirect to login
    if (error || !payload) {
      return NextResponse.redirect(new URL("/?invalid=true", req.url))
    }
  }

  // For public routes with valid JWT, redirect to home
  if (isPublicRoute && jwt) {
    try {
      const { payload, error } = await verifyJWT(jwt)

      if (!error && payload) {
        // Don't redirect if already on login page with specific parameters
        const hasParams = req.nextUrl.search.length > 0
        if (path === "/" && hasParams) {
          return NextResponse.next()
        }

        return NextResponse.redirect(new URL("/home", req.url))
      }
    } catch (error) {
      // If JWT verification fails, continue to public route
      console.error("JWT verification error in middleware:", error)
    }
  }

  return NextResponse.next()
}
