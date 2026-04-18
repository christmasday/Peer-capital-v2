import { NextRequest, NextResponse } from "next/server"
import { sendNotificationEmail, NotificationEvent } from "@/lib/notification-service"

export async function POST(request: NextRequest) {
  try {
    const event: NotificationEvent = await request.json()
    
    // Validate required fields
    if (!event.type || !event.userId || !event.title || !event.description) {
      return NextResponse.json(
        { message: "Missing required fields: type, userId, title, description" },
        { status: 400 }
      )
    }

    // Validate event type
    const validEventTypes = [
      'login', 'password_change', 'account_funding', 
      'withdrawal', 'loan_request', 'loan_repayment', 'verification', 'security_alert'
    ]
    
    if (!validEventTypes.includes(event.type)) {
      return NextResponse.json(
        { message: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Send notification email
    const success = await sendNotificationEmail(event)

    if (success) {
      return NextResponse.json({ 
        message: "Notification sent successfully",
        sent: true
      })
    } else {
      return NextResponse.json({ 
        message: "Notification not sent (user may be logged in or has disabled notifications)",
        sent: false
      })
    }
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
