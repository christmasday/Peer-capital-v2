import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createTransactionActivityNotification } from "@/lib/actions/activity-notifications"
import { revalidatePath } from "next/cache"

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
          await handleChargeSuccess(payload.data, adminClient)
          break
        case "transfer.success":
          await handleTransferSuccess(payload.data, adminClient)
          break
        case "transfer.failed":
          await handleTransferFailed(payload.data, adminClient)
          break
        case "customeridentification.success":
          await handleCustomerIdentificationSuccess(payload.data, adminClient)
          break
        case "customeridentification.failed":
          await handleCustomerIdentificationFailed(payload.data, adminClient)
          break
        case "dedicatedaccount.assign.success":
          await handleDedicatedAccountAssignSuccess(payload.data, adminClient)
          break
        case "dedicatedaccount.assign.failed":
          await handleDedicatedAccountAssignFailed(payload.data, adminClient)
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

// Handle successful charge events (when payment is made)
async function handleChargeSuccess(data: any, adminClient: any) {
  try {
    // Extract relevant information
    const { amount, currency, reference, customer, metadata, channel } = data

    // Convert amount from kobo to naira (Paystack uses kobo)
    const amountInNaira = amount / 100

    // If this is a dedicated account payment, it will have the account details
    if (channel === "dedicated_nuban") {
      // Handle virtual account payment (existing code)
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

      // Verify the user exists in our system
      const { data: userExists, error: userError } = await adminClient
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single()

      if (userError || !userExists) {
        console.error("User not found for virtual account payment:", userId, userError)
        return
      }

      // Process the virtual account payment
      await processPayment(userId, amountInNaira, reference, "Virtual Account", data, adminClient)
    }
    // If this is a regular payment (from the fund account form)
    else if (metadata && metadata.user_id && metadata.transaction_id) {
      const userId = metadata.user_id
      const transactionId = metadata.transaction_id
      const paymentMethod = metadata.payment_method || "Paystack"

      // Verify the user exists in our system
      const { data: userExists, error: userError } = await adminClient
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single()

      if (userError || !userExists) {
        console.error("User not found for payment:", userId, userError)
        return
      }

      // Check if the transaction exists and is still pending
      const { data: transaction, error: transactionError } = await adminClient
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .eq("user_id", userId)
        .eq("status", "pending")
        .single()

      if (transactionError) {
        console.error("Error fetching transaction:", transactionError)
        return
      }

      if (!transaction) {
        // Transaction might have been already processed or doesn't exist
        console.log(`Transaction ${transactionId} not found or already processed`)
        return
      }

      // Update the transaction status
      const { error: updateError } = await adminClient
        .from("transactions")
        .update({
          status: "completed",
          amount: amountInNaira, // Ensure the amount is correct
          updated_at: new Date().toISOString(),
        })
        .eq("id", transactionId)

      if (updateError) {
        console.error("Error updating transaction:", updateError)
        return
      }

      // Update the user's account balance
      await updateAccountBalance(userId, amountInNaira, adminClient)

      // Create a notification
      await createNotification(userId, amountInNaira, reference, paymentMethod, adminClient)

      // Create activity notification
      try {
        await createTransactionActivityNotification({
          userId,
          amount: amountInNaira,
          type: "deposit",
          reference,
          description: `Account funded with ₦${amountInNaira.toLocaleString()} via ${paymentMethod}`,
        })
      } catch (notificationError) {
        console.error("Error creating activity notification:", notificationError)
      }

      // Revalidate relevant paths
      revalidatePath("/account/fund")
      revalidatePath("/home")
      revalidatePath("/profile")
      revalidatePath("/transactions")

      console.log(`Successfully processed payment of ${amountInNaira} for user ${userId}`)
    } else {
      console.log("Payment received but no user_id or transaction_id in metadata:", metadata)
    }
  } catch (error) {
    console.error("Error handling charge.success webhook:", error)
    throw error
  }
}

// Process payment (common function for different payment types)
async function processPayment(
  userId: string,
  amount: number,
  reference: string,
  source: string,
  paymentDetails: any,
  adminClient: any,
) {
  // Verify the user exists in our system
  const { data: userExists, error: userError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single()

  if (userError || !userExists) {
    console.error("User not found for payment processing:", userId, userError)
    throw new Error("User not found")
  }

  // Create a transaction record if it doesn't exist
  const { data: existingTransaction } = await adminClient
    .from("transactions")
    .select("id")
    .eq("reference", reference)
    .single()

  if (!existingTransaction) {
    const transactionData = {
      user_id: userId,
      amount: amount,
      type: "deposit",
      description: `Account funding via ${source}`,
      reference: reference,
      status: "completed",
      created_at: new Date().toISOString(),
      metadata: {
        provider: "paystack",
        paystack_reference: reference,
        payment_details: paymentDetails,
      },
    }

    const { error: transactionError } = await adminClient.from("transactions").insert(transactionData)

    if (transactionError) {
      console.error("Error creating transaction record:", transactionError)
      return
    }
  }

  // Update the user's account balance
  await updateAccountBalance(userId, amount, adminClient)

  // Create a notification
  await createNotification(userId, amount, reference, source, adminClient)

  // Create activity notification
  try {
    await createTransactionActivityNotification({
      userId,
      amount: amount,
      type: "deposit",
      reference: reference,
      description: `Account funded with ₦${amount.toLocaleString()} via ${source}`,
    })
  } catch (notificationError) {
    console.error("Error creating activity notification:", notificationError)
  }

  // Revalidate relevant paths
  revalidatePath("/account/fund")
  revalidatePath("/home")
  revalidatePath("/profile")
  revalidatePath("/transactions")

  console.log(`Successfully processed payment of ${amount} for user ${userId}`)
}

// Update account balance
async function updateAccountBalance(userId: string, amount: number, adminClient: any) {
  // Verify the user exists in our system
  const { data: userExists, error: userError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single()

  if (userError || !userExists) {
    console.error("User not found for account balance update:", userId, userError)
    throw new Error("User not found")
  }

  const { data: accountBalance, error: balanceError } = await adminClient
    .from("account_balances")
    .select("balance")
    .eq("user_id", userId)
    .single()

  if (balanceError) {
    console.error("Error fetching account balance:", balanceError)
    return
  }

  const currentBalance = accountBalance?.balance || 0
  const newBalance = currentBalance + amount

  const { error: updateError } = await adminClient
    .from("account_balances")
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (updateError) {
    console.error("Error updating account balance:", updateError)
  }
}

// Create notification
async function createNotification(userId: string, amount: number, reference: string, source: string, adminClient: any) {
  // Verify the user exists in our system
  const { data: userExists, error: userError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single()

  if (userError || !userExists) {
    console.error("User not found for notification creation:", userId, userError)
    throw new Error("User not found")
  }

  const notificationData = {
    user_id: userId,
    type: "account_funded",
    data: {
      amount: amount,
      reference: reference,
      source: source,
    },
    read: false,
    created_at: new Date().toISOString(),
  }

  await adminClient.from("notifications").insert(notificationData)
}

// Handle successful transfer events (for withdrawals)
async function handleTransferSuccess(data: any, adminClient: any) {
  try {
    const { reference, amount, recipient, reason } = data

    // Find the transaction by reference
    const { data: transaction, error: transactionError } = await adminClient
      .from("transactions")
      .select("*")
      .eq("reference", reference)
      .single()

    if (transactionError || !transaction) {
      console.error("Could not find transaction for transfer:", reference, transactionError)
      return
    }

    const userId = transaction.user_id

    // Update the transaction status
    const { error: updateError } = await adminClient
      .from("transactions")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)

    if (updateError) {
      console.error("Error updating transaction:", updateError)
      return
    }

    // Create a notification for the user
    const notificationData = {
      user_id: userId,
      type: "withdrawal_completed",
      data: {
        amount: transaction.amount,
        reference: reference,
        recipient: recipient?.description || "Bank Account",
      },
      read: false,
      created_at: new Date().toISOString(),
    }

    await adminClient.from("notifications").insert(notificationData)

    // Revalidate relevant paths
    revalidatePath("/account/withdraw")
    revalidatePath("/home")
    revalidatePath("/profile")
    revalidatePath("/transactions")

    console.log(`Successfully processed withdrawal of ${transaction.amount} for user ${userId}`)
  } catch (error) {
    console.error("Error handling transfer.success webhook:", error)
    throw error
  }
}

// Handle failed transfer events (for withdrawals)
async function handleTransferFailed(data: any, adminClient: any) {
  try {
    const { reference, amount, recipient, reason } = data

    // Find the transaction by reference
    const { data: transaction, error: transactionError } = await adminClient
      .from("transactions")
      .select("*")
      .eq("reference", reference)
      .single()

    if (transactionError || !transaction) {
      console.error("Could not find transaction for failed transfer:", reference, transactionError)
      return
    }

    const userId = transaction.user_id

    // Update the transaction status
    const { error: updateError } = await adminClient
      .from("transactions")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)

    if (updateError) {
      console.error("Error updating transaction:", updateError)
      return
    }

    // Refund the amount to the user's account balance
    const { data: accountData, error: accountError } = await adminClient
      .from("account_balances")
      .select("balance")
      .eq("user_id", userId)
      .single()

    if (accountError) {
      console.error("Error fetching account balance:", accountError)
      return
    }

    const currentBalance = accountData?.balance || 0
    const newBalance = currentBalance + transaction.amount

    const { error: balanceUpdateError } = await adminClient
      .from("account_balances")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (balanceUpdateError) {
      console.error("Error updating account balance:", balanceUpdateError)
      return
    }

    // Create a notification for the user
    const notificationData = {
      user_id: userId,
      type: "withdrawal_failed",
      data: {
        amount: transaction.amount,
        reference: reference,
        reason: reason || "Unknown error",
        recipient: recipient?.description || "Bank Account",
      },
      read: false,
      created_at: new Date().toISOString(),
    }

    await adminClient.from("notifications").insert(notificationData)

    // Revalidate relevant paths
    revalidatePath("/account/withdraw")
    revalidatePath("/home")
    revalidatePath("/profile")
    revalidatePath("/transactions")

    console.log(`Processed failed withdrawal of ${transaction.amount} for user ${userId}`)
  } catch (error) {
    console.error("Error handling transfer.failed webhook:", error)
    throw error
  }
}

// The following handlers are kept from the original file
async function handleCustomerIdentificationSuccess(data: any, adminClient: any) {
  // Find user by customer_code or email
  const customerCode = data.customer?.customer_code;
  if (customerCode) {
    // Update profile: set bvn_verified = true, bvn_verified_at = now
    await adminClient.from("profiles").update({
      bvn_verified: true,
      bvn_verified_at: new Date().toISOString(),
    }).eq("paystack_customer_code", customerCode);
  }
}

async function handleCustomerIdentificationFailed(data: any, adminClient: any) {
  // Optionally log or update status
  const customerCode = data.customer?.customer_code;
  if (customerCode) {
    await adminClient.from("profiles").update({
      bvn_verified: false,
    }).eq("paystack_customer_code", customerCode);
  }
}

async function handleDedicatedAccountAssignSuccess(data: any, adminClient: any) {
  // Extract relevant details from the event structure
  const accountData = data;
  const customer = accountData.customer;
  const customerCode = customer?.customer_code || customer?.email;
  const email = customer?.email || customerCode;

  if (!accountData.account_number || !email) {
    console.error("Missing account_number or email in dedicatedaccount.assign.success event", data);
    return;
  }

  // Upsert (insert or update) the virtual account in the database
  const virtualAccountData = {
    email: email,
    account_number: accountData.account_number,
    account_name: accountData.account_name,
    bank_name: accountData.bank?.name || accountData.bank_name,
    bank_code: accountData.bank?.id?.toString() || accountData.bank_code,
    currency: accountData.currency,
    assigned: accountData.assigned,
    paystack_id: accountData.id?.toString(),
    created_at: accountData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Upsert by email (if your table supports upsert, otherwise do update/insert logic)
  const { error } = await adminClient
    .from("virtual_accounts")
    .upsert([virtualAccountData], { onConflict: ["email"] });

  if (error) {
    console.error("Error upserting virtual account on assign.success:", error);
    return;
  }

  // Optionally, update the user's profile to indicate the virtual account is active
  await adminClient
    .from("profiles")
    .update({ virtual_account_active: true })
    .eq("email", email);

  console.log(`Virtual account assigned and upserted for email: ${email}`);
}

async function handleDedicatedAccountAssignFailed(data: any, adminClient: any) {
  // Extract relevant details
  const customer = data.customer;
  const customerCode = customer?.customer_code || customer?.email;
  const email = customer?.email || customerCode;

  // Log the failure
  console.error("Paystack dedicatedaccount.assign.failed event:", data);

  // Optionally, update the user's profile or virtual account status to indicate the failure
  if (email) {
    await adminClient
      .from("profiles")
      .update({ virtual_account_active: false })
      .eq("email", email);
    // Optionally, update a status field in virtual_accounts if you have one
    await adminClient
      .from("virtual_accounts")
      .update({ assigned: false, updated_at: new Date().toISOString() })
      .eq("email", email);
  }
}
