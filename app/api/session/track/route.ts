import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/auth-utils"
import { trackUserSession, sendNotificationEmail, updateSessionActivity } from "@/lib/notification-service"

export async function POST(request: NextRequest) {
  try {
    const { action, sessionToken, userAgent, ipAddress } = await request.json()
    
    if (!action || !['login', 'logout', 'activity'].includes(action)) {
      return NextResponse.json(
        { message: "Invalid action. Must be 'login', 'logout', or 'activity'" },
        { status: 400 }
      )
    }

    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      )
    }

    // Get client IP and user agent
    const clientIP = ipAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const clientUserAgent = userAgent || request.headers.get('user-agent') || 'unknown'

    if (action === 'login') {
      // Track login session
      await trackUserSession(currentUserId, 'login', sessionToken, clientUserAgent, clientIP)
      
      // Send login notification (regardless of login status)
      await sendNotificationEmail({
        type: 'login',
        userId: currentUserId,
        title: 'New Login Detected',
        description: 'We detected a new login to your PeerCapital account.',
        metadata: {
          ip_address: clientIP,
          user_agent: clientUserAgent,
          timestamp: new Date().toISOString(),
        }
      })
    } else if (action === 'logout') {
      // Track logout session
      await trackUserSession(currentUserId, 'logout')
      
      // Send logout notification (regardless of login status)
      await sendNotificationEmail({
        type: 'logout',
        userId: currentUserId,
        title: 'Account Logout',
        description: 'You have been logged out of your PeerCapital account.',
        metadata: {
          timestamp: new Date().toISOString(),
        }
      })
    } else if (action === 'activity') {
      // Update session activity
      if (sessionToken) {
        await updateSessionActivity(currentUserId, sessionToken)
      }
    }

    return NextResponse.json({ 
      message: `Session ${action} tracked successfully` 
    })
  } catch (error) {
    console.error("Error tracking session:", error)
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
