import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const adminClient = createAdminClient()
  let eventId: string | null = null

  try {
    // Get the request body
    const body = await request.text()
    const payload = JSON.parse(body)

    // Verify the webhook signature
    const signature = request.headers.get("x-paystack-signature")
    if (!signature) {
      console.error("No Paystack signature found in webhook request")
      return NextResponse.json({ error: "Invalid request" }, { status: 401 })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      console.error("Paystack secret key not configured")
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }

    // Verify the signature
    const hash = crypto.createHmac("sha512", secretKey).update(body).digest("hex")
    if (hash !== signature) {
      console.error("Invalid Paystack signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Process the webhook based on event type
    const event = payload.event

    console.log(`Processing Paystack webhook: ${event}`, payload)

    // Log the webhook event to the database
    const { data: eventData, error: eventError } = await adminClient
      .from("webhook_events")
      .insert({
        event_type: event,
        payload: payload,
        created_at: new Date().toISOString(),
      })
      .select()

    if (eventError) {
      console.error("Error logging webhook event:", eventError)
    } else if (eventData && eventData.length > 0) {
      eventId = eventData[0].id
    }

    // Handle different event types
    try {
      switch (event) {
        case "charge.success":
          await handleChargeSuccess(payload.data)
          break
        case "customeridentification.success":
          await handleCustomerIdentificationSuccess(payload.data)
          break
        case "customeridentification.failed":
          await handleCustomerIdentificationFailed(payload.data)
          break
        case "dedicatedaccount.assign.success":
          await handleDedicatedAccountAssignSuccess(payload.data)
          break
        case "dedicatedaccount.assign.failed":
          await handleDedicatedAccountAssignFailed(payload.data)
          break
        default:
          console.log(`Unhandled Paystack webhook event: ${event}`)
      }

      // Update the webhook event as processed
      if (eventId) {
        await adminClient
          .from("webhook_events")
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq("id", eventId)
      }
    } catch (processingError) {
      console.error(`Error processing webhook event ${event}:`, processingError)

      // Update the webhook event with the processing error
      if (eventId) {
        await adminClient
          .from("webhook_events")
          .update({
            processed: false,
            processing_error: processingError instanceof Error ? processingError.message : String(processingError),
          })
          .eq("id", eventId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing Paystack webhook:", error)

    // Update the webhook event with the processing error if we have an eventId
    if (eventId) {
      await adminClient
        .from("webhook_events")
        .update({
          processed: false,
          processing_error: error instanceof Error ? error.message : String(error),
        })
        .eq("id", eventId)
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Handle successful charge events (when money is paid to a virtual account)
async function handleChargeSuccess(data: any) {
  try {
    const adminClient = createAdminClient()

    // Extract relevant information
    const { amount, currency, reference, customer, metadata, channel } = data

    // If this is a dedicated account payment, it will have the account details
    if (channel === "dedicated_nuban") {
      const accountNumber = data.authorization?.account_number
      if (!accountNumber) {
        console.error("No account number found in dedicated_nuban payment", data)
        return
      }

      // Find the user associated with this virtual account
      const { data: virtualAccount, error: vaError } = await adminClient
        .from("virtual_accounts")
        .select("user_id")
        .eq("account_number", accountNumber)
        .single()

      if (vaError || !virtualAccount) {
        console.error("Could not find virtual account for payment:", accountNumber, vaError)
        return
      }

      const userId = virtualAccount.user_id

      // Convert amount from kobo to naira (Paystack uses kobo)
      const amountInNaira = amount / 100

      // Create a transaction record
      const transactionData = {
        user_id: userId,
        amount: amountInNaira,
        type: "deposit",
        description: `Virtual account funding via Paystack`,
        reference: reference,
        status: "completed",
        created_at: new Date().toISOString(),
        metadata: {
          provider: "paystack",
          paystack_reference: reference,
          channel: channel,
          customer_email: customer.email,
          payment_details: data,
        },
      }

      // Insert the transaction
      const { error: transactionError } = await adminClient.from("transactions").insert(transactionData)

      if (transactionError) {
        console.error("Error creating transaction record:", transactionError)
        return
      }

      // Update the user's account balance
      const { data: accountBalance, error: balanceError } = await adminClient
        .from("account_balances")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (balanceError) {
        console.error("Error fetching account balance:", balanceError)
        return
      }

      const newBalance = (accountBalance.balance || 0) + amountInNaira

      const { error: updateError } = await adminClient
        .from("account_balances")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId)

      if (updateError) {
        console.error("Error updating account balance:", updateError)
        return
      }

      // Create a notification for the user
      const notificationData = {
        user_id: userId,
        type: "account_funded",
        data: {
          amount: amountInNaira,
          reference: reference,
          source: "Virtual Account",
        },
        read: false,
        created_at: new Date().toISOString(),
      }

      await adminClient.from("notifications").insert(notificationData)

      console.log(`Successfully processed virtual account payment of ${amountInNaira} for user ${userId}`)
    }
  } catch (error) {
    console.error("Error handling charge.success webhook:", error)
    throw error
  }
}

// Handle successful customer identification
async function handleCustomerIdentificationSuccess(data: any) {
  try {
    const adminClient = createAdminClient()
    const { customer, identification } = data

    // Find the user by email
    const { data: user, error: userError } = await adminClient
      .from("auth_users")
      .select("id")
      .eq("email", customer.email)
      .single()

    if (userError || !user) {
      console.error("Could not find user for customer identification:", customer.email, userError)
      return
    }

    // Update the user's profile with verification information
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        id_verified: true,
        id_verification_date: new Date().toISOString(),
        id_type: identification.type,
        id_number: identification.number,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating user profile with verification info:", updateError)
      return
    }

    // Create a notification for the user
    const notificationData = {
      user_id: user.id,
      type: "identity_verified",
      data: {
        verification_type: identification.type,
        verification_date: new Date().toISOString(),
      },
      read: false,
      created_at: new Date().toISOString(),
    }

    await adminClient.from("notifications").insert(notificationData)

    console.log(`Successfully processed identity verification for user ${user.id}`)
  } catch (error) {
    console.error("Error handling customeridentification.success webhook:", error)
    throw error
  }
}

// Handle failed customer identification
async function handleCustomerIdentificationFailed(data: any) {
  try {
    const adminClient = createAdminClient()
    const { customer, identification, reason } = data

    // Find the user by email
    const { data: user, error: userError } = await adminClient
      .from("auth_users")
      .select("id")
      .eq("email", customer.email)
      .single()

    if (userError || !user) {
      console.error("Could not find user for failed customer identification:", customer.email, userError)
      return
    }

    // Update the user's profile with verification failure
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        id_verified: false,
        id_verification_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating user profile with verification failure:", updateError)
      return
    }

    // Create a notification for the user
    const notificationData = {
      user_id: user.id,
      type: "identity_verification_failed",
      data: {
        verification_type: identification.type,
        reason: reason || "Unknown error",
        verification_date: new Date().toISOString(),
      },
      read: false,
      created_at: new Date().toISOString(),
    }

    await adminClient.from("notifications").insert(notificationData)

    console.log(`Notified user ${user.id} about failed identity verification`)
  } catch (error) {
    console.error("Error handling customeridentification.failed webhook:", error)
    throw error
  }
}

// Handle successful dedicated account assignment
async function handleDedicatedAccountAssignSuccess(data: any) {
  try {
    const adminClient = createAdminClient()
    const { customer, dedicated_account } = data

    // Find the user by email
    const { data: user, error: userError } = await adminClient
      .from("auth_users")
      .select("id")
      .eq("email", customer.email)
      .single()

    if (userError || !user) {
      console.error("Could not find user for dedicated account:", customer.email, userError)
      return
    }

    // Check if we already have a virtual account for this user
    const { data: existingAccount } = await adminClient
      .from("virtual_accounts")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (existingAccount) {
      // Update the existing account
      const { error: updateError } = await adminClient
        .from("virtual_accounts")
        .update({
          account_number: dedicated_account.account_number,
          account_name: dedicated_account.account_name,
          bank_name: dedicated_account.bank.name,
          bank_code: dedicated_account.bank.slug,
          currency: dedicated_account.currency,
          assigned: true,
          status: "active",
          paystack_id: dedicated_account.id.toString(),
          assignment_details: dedicated_account.assignment,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (updateError) {
        console.error("Error updating virtual account:", updateError)
        return
      }
    } else {
      // Create a new virtual account record
      const virtualAccountData = {
        user_id: user.id,
        account_number: dedicated_account.account_number,
        account_name: dedicated_account.account_name,
        bank_name: dedicated_account.bank.name,
        bank_code: dedicated_account.bank.slug,
        currency: dedicated_account.currency,
        assigned: true,
        status: "active",
        paystack_id: dedicated_account.id.toString(),
        assignment_details: dedicated_account.assignment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: insertError } = await adminClient.from("virtual_accounts").insert(virtualAccountData)

      if (insertError) {
        console.error("Error storing virtual account:", insertError)
        return
      }
    }

    // Create a notification for the user
    const notificationData = {
      user_id: user.id,
      type: "virtual_account_created",
      data: {
        account_number: dedicated_account.account_number,
        account_name: dedicated_account.account_name,
        bank_name: dedicated_account.bank.name,
      },
      read: false,
      created_at: new Date().toISOString(),
    }

    await adminClient.from("notifications").insert(notificationData)

    console.log(`Successfully processed dedicated account assignment for user ${user.id}`)
  } catch (error) {
    console.error("Error handling dedicatedaccount.assign.success webhook:", error)
    throw error
  }
}

// Handle failed dedicated account assignment
async function handleDedicatedAccountAssignFailed(data: any) {
  try {
    const adminClient = createAdminClient()
    const { customer, reason } = data

    // Find the user by email
    const { data: user, error: userError } = await adminClient
      .from("auth_users")
      .select("id")
      .eq("email", customer.email)
      .single()

    if (userError || !user) {
      console.error("Could not find user for failed dedicated account:", customer.email, userError)
      return
    }

    // Update any existing virtual account record to failed status
    const { error: updateError } = await adminClient
      .from("virtual_accounts")
      .update({
        assigned: false,
        status: "failed",
        failure_reason: reason || "Unknown error",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    // It's okay if there's no record to update
    if (updateError && updateError.code !== "PGRST116") {
      console.error("Error updating virtual account status:", updateError)
    }

    // Create a notification for the user
    const notificationData = {
      user_id: user.id,
      type: "virtual_account_failed",
      data: {
        reason: reason || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      read: false,
      created_at: new Date().toISOString(),
    }

    await adminClient.from("notifications").insert(notificationData)

    console.log(`Notified user ${user.id} about failed virtual account assignment`)
  } catch (error) {
    console.error("Error handling dedicatedaccount.assign.failed webhook:", error)
    throw error
  }
}
