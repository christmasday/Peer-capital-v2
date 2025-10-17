import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 'sr_user_id', 'correlation_id']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate phone number
    if (!/^\d+$/.test(body.phoneNumber) || body.phoneNumber.length > 11) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    // Validate date of birth (must be 18+)
    const dob = new Date(body.dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - dob.getFullYear()
    if (age < 18) {
      return NextResponse.json({ error: "You must be at least 18 years old" }, { status: 400 })
    }

    const admin = createAdminClient()
    
    // Check if user already exists
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id, email, phone_number, bvn')
      .or(`email.eq.${body.email},phone_number.eq.${body.phoneNumber}`)
      .single()

    if (existingProfile) {
      return NextResponse.json({ 
        error: "User with this email or phone number already exists" 
      }, { status: 400 })
    }

    // Create Supabase auth user
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Generate a temporary password (user will need to reset it)
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: body.firstName,
        last_name: body.lastName,
        phone_number: body.phoneNumber
      }
    })

    if (authError || !authUser.user) {
      console.error("Auth user creation error:", authError)
      return NextResponse.json({ 
        error: "Failed to create user account" 
      }, { status: 500 })
    }

    // Create profile record
    const profileData = {
      id: authUser.user.id,
      email: body.email,
      first_name: body.firstName,
      middle_name: body.middleName || null,
      last_name: body.lastName,
      phone_number: body.phoneNumber,
      date_of_birth: body.dateOfBirth,
      referral_code: body.referralCode || null,
      sr_user_id: body.sr_user_id,
      correlation_id: body.correlation_id,
      bvn_verified: true, // Since we went through BVN verification
      bvn_verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: profileError } = await admin
      .from('profiles')
      .insert(profileData)

    if (profileError) {
      console.error("Profile creation error:", profileError)
      // Try to clean up the auth user
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ 
        error: "Failed to create user profile" 
      }, { status: 500 })
    }

    // Create welcome notification
    try {
      await admin.from('notifications').insert({
        id: crypto.randomUUID(),
        user_id: authUser.user.id,
        actor_id: authUser.user.id,
        type: 'welcome',
        data: { 
          message: 'Welcome to Peer Capital! Your account has been created successfully.',
          provider: 'system'
        },
        read: false,
        created_at: new Date().toISOString()
      })
    } catch (notificationError) {
      // Non-blocking - notification creation failure shouldn't break signup
      console.error("Notification creation error:", notificationError)
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully! Please check your email for login instructions.",
      userId: authUser.user.id
    })

  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
