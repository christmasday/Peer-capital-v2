import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { v4 as uuidv4 } from "uuid"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { verifyJWT } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    const { amount, paymentMethod, userId: requestUserId } = body

    // Get the current user ID using multiple authentication methods
    let userId = null

    // Method 0: Use the user ID from the request body if available
    if (requestUserId) {
      userId = requestUserId
    }

    // Method 1: Try JWT authentication if no user ID from request
    if (!userId) {
      try {
        const jwt = request.cookies.get("jwt-token")?.value
        if (jwt) {
          const { payload, error } = await verifyJWT(jwt)
          if (!error && payload && (payload.sub || payload.userId)) {
            userId = payload.sub || payload.userId
          }
        }
      } catch (error) {
      }
    }

    // Method 2: Try Supabase authentication if still no user ID
    if (!userId) {
      try {
        const cookieStore = cookies()
        const supabase = createServerClient(cookieStore)
        const { data } = await supabase.auth.getSession()

        if (data.session?.user?.id) {
          userId = data.session.user.id
        }
      } catch (error) {
      }
    }

    // Method 3: Try custom auth token if still no user ID
    if (!userId) {
      try {
        const customAuthToken = request.cookies.get("custom-auth-token")?.value
        if (customAuthToken) {
          const adminClient = createAdminClient()
          const { data, error } = await adminClient
            .from("auth_users")
            .select("id")
            .eq("access_token", customAuthToken)
            .single()

          if (!error && data?.id) {
            userId = data.id
          }
        }
      } catch (error) {
      }
    }

    // Method 4: Development fallback (only in development)
    if (!userId && process.env.NODE_ENV === "development") {
      try {
        const adminClient = createAdminClient()
        const { data } = await adminClient.from("profiles").select("id").limit(1).single()

        if (data?.id) {
          userId = data.id
        }
      } catch (error) {
      }
    }

    // If all authentication methods failed
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!amount || amount < 100) {
      return NextResponse.json({ error: "Amount must be at least ₦100" }, { status: 400 })
    }

    // Get user profile for email
    const adminClient = createAdminClient()
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("email, first_name, last_name, phone_number")
      .eq("id", userId)
      .single()

    if (profileError || !profile || !profile.email) {
      return NextResponse.json({ error: "Could not fetch user profile or email is missing" }, { status: 500 })
    }

    // Generate a unique reference
    const reference = `PC-${Date.now().toString().substring(7)}-${Math.floor(Math.random() * 10000)}`

    // Create a pending transaction record
    const transactionId = uuidv4()
    const { error: transactionError } = await adminClient.from("transactions").insert({
      id: transactionId,
      user_id: userId,
      amount: amount / 100, // Convert from kobo to naira
      type: "deposit",
      description: `Account funding via Paystack (${paymentMethod})`,
      reference: reference,
      status: "pending", // Will be updated to completed when payment is confirmed
      created_at: new Date().toISOString(),
    })

    if (transactionError) {
      return NextResponse.json({ error: "Failed to create transaction record" }, { status: 500 })
    }

    // Initialize Paystack transaction
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Payment provider configuration error" }, { status: 500 })
    }

    // Prepare the request payload
    const payload = {
      email: profile.email,
      amount: amount, // Amount in kobo (Paystack uses kobo)
      reference: reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account/fund/callback`,
      metadata: {
        user_id: userId,
        transaction_id: transactionId,
        payment_method: paymentMethod,
        custom_fields: [
          {
            display_name: "Payment For",
            variable_name: "payment_for",
            value: "Account Funding",
          },
          {
            display_name: "User",
            variable_name: "user_name",
            value: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User",
          },
        ],
      },
    }

    // Make the API call to Paystack
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseData = await response.json()

    if (!responseData.status) {
      return NextResponse.json({ error: responseData.message || "Failed to initialize payment" }, { status: 500 })
    }

    // Return the authorization URL and other details
    return NextResponse.json({
      success: true,
      authorizationUrl: responseData.data.authorization_url,
      reference: reference,
      transactionId: transactionId,
    })
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 })
  }
}
