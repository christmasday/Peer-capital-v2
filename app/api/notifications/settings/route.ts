import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getCurrentUserId } from "@/lib/auth-utils"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      )
    }

    // Get notification preferences from the database
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", currentUserId)
      .single()

    if (error && error.code !== "PGRST116") { // PGRST116 is "not found"
      console.error("Error fetching notification preferences:", error)
      return NextResponse.json(
        { message: "Failed to fetch notification settings" },
        { status: 500 }
      )
    }

    // Return default settings if no preferences found
    if (!data) {
      return NextResponse.json({
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
        transactionAlerts: true,
        securityAlerts: true,
        transactionActivity: true,
        loanActivity: true,
        connectionActivity: true,
        messageActivity: true,
        verificationActivity: true,
        accountActivity: true,
        systemActivity: true,
        muteAllNotifications: false,
      })
    }

    // Check if all notifications are disabled (mute all)
    const allNotificationsDisabled = !(
      data.email_notifications || 
      data.sms_notifications || 
      data.push_notifications || 
      data.marketing_emails || 
      data.transaction_alerts || 
      data.security_alerts || 
      data.transaction_activity || 
      data.loan_activity || 
      data.connection_activity || 
      data.message_activity || 
      data.verification_activity || 
      data.account_activity || 
      data.system_activity
    )

    return NextResponse.json({
      emailNotifications: data.email_notifications ?? true,
      smsNotifications: data.sms_notifications ?? true,
      pushNotifications: data.push_notifications ?? true,
      marketingEmails: data.marketing_emails ?? false,
      transactionAlerts: data.transaction_alerts ?? true,
      securityAlerts: data.security_alerts ?? true,
      transactionActivity: data.transaction_activity ?? true,
      loanActivity: data.loan_activity ?? true,
      connectionActivity: data.connection_activity ?? true,
      messageActivity: data.message_activity ?? true,
      verificationActivity: data.verification_activity ?? true,
      accountActivity: data.account_activity ?? true,
      systemActivity: data.system_activity ?? true,
      muteAllNotifications: allNotificationsDisabled,
    })
  } catch (error) {
    console.error("Error in notification settings GET:", error)
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)
    
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      emailNotifications,
      smsNotifications,
      pushNotifications,
      marketingEmails,
      transactionAlerts,
      securityAlerts,
      transactionActivity,
      loanActivity,
      connectionActivity,
      messageActivity,
      verificationActivity,
      accountActivity,
      systemActivity,
      muteAllNotifications,
    } = body

    // Validate the request body
    const booleanFields = [
      'emailNotifications', 'smsNotifications', 'pushNotifications', 'marketingEmails',
      'transactionAlerts', 'securityAlerts', 'transactionActivity', 'loanActivity',
      'connectionActivity', 'messageActivity', 'verificationActivity', 'accountActivity',
      'systemActivity', 'muteAllNotifications'
    ]

    for (const field of booleanFields) {
      if (typeof body[field] !== "boolean") {
        return NextResponse.json(
          { message: `Invalid notification settings format: ${field} must be boolean` },
          { status: 400 }
        )
      }
    }

    // Prepare the data for database
    const notificationData = {
      user_id: currentUserId,
      email_notifications: muteAllNotifications ? false : emailNotifications,
      sms_notifications: muteAllNotifications ? false : smsNotifications,
      push_notifications: muteAllNotifications ? false : pushNotifications,
      marketing_emails: muteAllNotifications ? false : marketingEmails,
      transaction_alerts: muteAllNotifications ? false : transactionAlerts,
      security_alerts: muteAllNotifications ? false : securityAlerts,
      transaction_activity: muteAllNotifications ? false : transactionActivity,
      loan_activity: muteAllNotifications ? false : loanActivity,
      connection_activity: muteAllNotifications ? false : connectionActivity,
      message_activity: muteAllNotifications ? false : messageActivity,
      verification_activity: muteAllNotifications ? false : verificationActivity,
      account_activity: muteAllNotifications ? false : accountActivity,
      system_activity: muteAllNotifications ? false : systemActivity,
      updated_at: new Date().toISOString(),
    }

    // Check if preferences exist
    const { data: existingData } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", currentUserId)
      .single()

    let result
    if (existingData) {
      // Update existing preferences
      result = await supabase
        .from("notification_preferences")
        .update(notificationData)
        .eq("user_id", currentUserId)
    } else {
      // Insert new preferences
      result = await supabase
        .from("notification_preferences")
        .insert(notificationData)
    }

    if (result.error) {
      console.error("Error saving notification preferences:", result.error)
      return NextResponse.json(
        { message: "Failed to save notification settings" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Notification settings saved successfully",
      settings: {
        emailNotifications: notificationData.email_notifications,
        smsNotifications: notificationData.sms_notifications,
        pushNotifications: notificationData.push_notifications,
        marketingEmails: notificationData.marketing_emails,
        transactionAlerts: notificationData.transaction_alerts,
        securityAlerts: notificationData.security_alerts,
        transactionActivity: notificationData.transaction_activity,
        loanActivity: notificationData.loan_activity,
        connectionActivity: notificationData.connection_activity,
        messageActivity: notificationData.message_activity,
        verificationActivity: notificationData.verification_activity,
        accountActivity: notificationData.account_activity,
        systemActivity: notificationData.system_activity,
        muteAllNotifications,
      }
    })
  } catch (error) {
    console.error("Error in notification settings POST:", error)
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
