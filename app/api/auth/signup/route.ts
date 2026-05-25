import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hashPassword } from "@/lib/auth-utils/password"
import { resetPassword } from "@/lib/actions/auth"
import { generateSystemUsername } from "@/lib/utils/username"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = (body?.email || "").toString().trim().toLowerCase()
    const firstName = (body?.firstName || "").toString().trim()
    const lastName = (body?.lastName || "").toString().trim()
    const phoneNumber = (body?.phoneNumber || "").toString().trim()
    const middleName = (body?.middleName || "").toString().trim() || null
    const dateOfBirth = body?.dateOfBirth || null
    const referralCode = (body?.referralCode || "").toString().trim() || null

    // Require successful email confirmation before allowing signup completion.
    const verifiedCookie = req.cookies.get("signup-email-verified")?.value
    if (!verifiedCookie) {
      return NextResponse.json({ error: "Email confirmation is required" }, { status: 403 })
    }

    let verifiedEmail: string | null = null
    try {
      const parsed = JSON.parse(verifiedCookie)
      verifiedEmail = (parsed?.email || "").toString().trim().toLowerCase()
    } catch {
      return NextResponse.json({ error: "Invalid confirmation session. Please verify your email again." }, { status: 403 })
    }

    if (!verifiedEmail || verifiedEmail !== email) {
      return NextResponse.json({ error: "Email does not match confirmed email. Please verify again." }, { status: 403 })
    }
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phoneNumber']
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

    // Validate optional date of birth (must be 18+ if provided)
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - dob.getFullYear()
      if (age < 18) {
        return NextResponse.json({ error: "You must be at least 18 years old" }, { status: 400 })
      }
    }

    const admin = createAdminClient()

    const findSupabaseAuthUserByEmail = async (targetEmail: string) => {
      const pageSize = 200
      for (let page = 1; page <= 10; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: pageSize })
        if (error) {
          return { user: null, error }
        }

        const user = data?.users?.find((entry) => (entry.email || "").toLowerCase() === targetEmail)
        if (user) {
          return { user, error: null }
        }

        if (!data?.users || data.users.length < pageSize) {
          break
        }
      }

      return { user: null, error: null }
    }
    
    // Check if user already exists
    const [existingProfileResult, existingAuthUserResult, existingCustomAuthUserResult, supabaseAuthUserResult] = await Promise.all([
      admin
        .from('profiles')
        .select('id, email, phone_number, bvn')
        .or(`email.eq.${email},phone_number.eq.${phoneNumber}`)
        .maybeSingle(),
      admin
        .from('auth_users')
        .select('id, email, phone')
        .or(`email.eq.${email},phone.eq.${phoneNumber}`)
        .maybeSingle(),
      admin
        .from('auth_users')
        .select('id')
        .eq('email', email)
        .maybeSingle(),
      findSupabaseAuthUserByEmail(email),
    ])

    const existingProfile = existingProfileResult.data
    const existingCustomAuthUser = existingAuthUserResult.data || existingCustomAuthUserResult.data
    const existingSupabaseAuthUser = supabaseAuthUserResult.user

    if (existingProfile || existingCustomAuthUser || existingSupabaseAuthUser) {
      return NextResponse.json({ 
        error: existingProfile && existingCustomAuthUser
          ? "An account with this email and phone number already exists. Please sign in instead."
          : existingProfile || existingSupabaseAuthUser
            ? "An account with this email already exists. Please sign in instead."
            : "An account with this phone number already exists. Please sign in instead."
      }, { status: 400 })
    }

    const username = await generateSystemUsername(admin)

        const userId = crypto.randomUUID()
        const now = new Date().toISOString()
        const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`
        const hashedPassword = await hashPassword(tempPassword)

        const { error: authUserError } = await admin.from("auth_users").insert({
          id: userId,
          email,
          phone: phoneNumber,
          encrypted_password: hashedPassword,
          email_confirmed_at: now,
          phone_confirmed_at: null,
          confirmation_sent_at: null,
          recovery_sent_at: null,
          email_change_sent_at: null,
          email_change: null,
          last_sign_in_at: null,
          raw_app_meta_data: { provider: "email", providers: ["email"] },
          raw_user_meta_data: {
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber,
            username,
          },
          is_super_admin: false,
          created_at: now,
          updated_at: now,
          is_sso_user: false,
          banned_until: null,
          reauthentication_sent_at: null,
          is_anonymous: false,
        })

        if (authUserError) {
          console.error("Custom auth user creation error:", authUserError)
          return NextResponse.json({
            error: "Failed to create user account",
          }, { status: 500 })
        }

    // Create profile record
    const profileData = {
      id: userId,
      email,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      username,
      phone_number: phoneNumber,
      date_of_birth: dateOfBirth,
      referral_code: referralCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: profileError } = await admin
      .from('profiles')
      .insert(profileData)

    if (profileError) {
      console.error("Profile creation error:", profileError)
      // Try to clean up the auth user
      await admin.from("auth_users").delete().eq("id", userId)
      return NextResponse.json({ 
        error: "Failed to create user profile" 
      }, { status: 500 })
    }

    // Create welcome notification
    try {
      await admin.from('notifications').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        actor_id: userId,
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

    try {
      const formData = new FormData()
      formData.append("email", email)
      await resetPassword(formData)
    } catch (passwordSetupError) {
      // Non-blocking - the user can still request a reset from the login page.
      console.error("Password setup email error:", passwordSetupError)
    }

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully! Please check your email for password setup instructions.",
      userId,
    })

    response.cookies.set("signup-email-verified", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })

    return response

  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
