import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cookies } from "next/headers"
import { getCurrentUserId } from "@/lib/auth-utils"
import { sendNotificationEmail } from "@/lib/notification-service"

export async function POST(request: NextRequest) {
  try {
    const { category, subject, description, email } = await request.json()

    // Validate required fields
    if (!category || !subject || !description || !email) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    let userId = null

    // Try to get current user ID (optional - support tickets can be submitted by non-logged-in users)
    try {
      userId = await getCurrentUserId()
    } catch (error) {
      // User is not logged in, which is fine for support tickets
    }

    // Create support ticket in database
    const ticketData = {
      user_id: userId,
      email: email,
      category: category,
      subject: subject,
      description: description,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: ticket, error: insertError } = await adminClient
      .from("support_tickets")
      .insert([ticketData])
      .select()
      .single()

    if (insertError) {
      console.error("Error creating support ticket:", insertError)
      return NextResponse.json(
        { error: "Failed to create support ticket" },
        { status: 500 }
      )
    }

    // Send email to support team
    const supportEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin: 0 0 10px 0;">New Support Ticket</h2>
          <p style="color: #6b7280; margin: 0;">A new support ticket has been submitted</p>
        </div>
        
        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Ticket ID:</strong>
            <span style="color: #6b7280; margin-left: 10px;">#${ticket.id}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Category:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${category}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Subject:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${subject}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">User Email:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${email}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">User ID:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${userId || 'Not logged in'}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Description:</strong>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin-top: 5px; color: #374151; white-space: pre-wrap;">${description}</div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Submitted:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${new Date().toLocaleString()}</span>
          </div>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; margin-top: 20px;">
          <p>&copy; ${new Date().getFullYear()} PeerCapital. All rights reserved.</p>
          <p>Lagos, Nigeria</p>
        </div>
      </div>
    `

    // Send email using Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (RESEND_API_KEY) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "PeerCapital Support <noreply@peercapital.com.ng>",
            to: ["support@peercapital.com.ng"],
            subject: `Support Ticket #${ticket.id}: ${subject}`,
            html: supportEmailHtml,
          }),
        })

        if (!emailResponse.ok) {
          console.error("Failed to send support email:", await emailResponse.text())
        }
      } catch (emailError) {
        console.error("Error sending support email:", emailError)
      }
    }

    // Send confirmation email to user
    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0;">Support Ticket Received</h2>
          <p style="color: #1e40af; margin: 0;">We've received your support request and will get back to you soon.</p>
        </div>
        
        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Ticket ID:</strong>
            <span style="color: #6b7280; margin-left: 10px;">#${ticket.id}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Category:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${category}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Subject:</strong>
            <span style="color: #6b7280; margin-left: 10px;">${subject}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #374151;">Status:</strong>
            <span style="color: #059669; margin-left: 10px;">Open</span>
          </div>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <p style="margin: 0; color: #374151;">
              <strong>What happens next?</strong><br>
              Our support team will review your request and respond within 24-48 hours. 
              You'll receive updates via email.
            </p>
          </div>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; margin-top: 20px;">
          <p>&copy; ${new Date().getFullYear()} PeerCapital. All rights reserved.</p>
          <p>Lagos, Nigeria</p>
        </div>
      </div>
    `

    try {
      const userEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "PeerCapital Support <noreply@peercapital.com.ng>",
          to: [email],
          subject: `Support Ticket #${ticket.id} Received`,
          html: userEmailHtml,
        }),
      })

      if (!userEmailResponse.ok) {
        console.error("Failed to send user confirmation email:", await userEmailResponse.text())
      }
    } catch (emailError) {
      console.error("Error sending user confirmation email:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: "Support ticket submitted successfully",
      ticketId: ticket.id
    })

  } catch (error) {
    console.error("Error submitting support ticket:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
