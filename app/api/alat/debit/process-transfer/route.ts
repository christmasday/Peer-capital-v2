import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";
import { verifyAuth } from "@/lib/auth-middleware";
import crypto from "crypto";

export async function POST(req: NextRequest) {
//   const authResult = await verifyAuth(req) as any;
//   if (!authResult.authenticated) {
//     return NextResponse.json({ error: "Authentication required" }, { status: 401 });
//   }

  try {
    const body = await req.json();

    // Validate required fields
    const requiredFields = [
      "transactionReference",
      "amount",
      "sourceAccountNumber",
      "destinationAccountNumber",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Generate transaction hash
    const hashString = `${body.transactionReference}|${body.amount}|${body.sourceAccountNumber}|${body.destinationAccountNumber}`;
    const transactionHash = crypto.createHash("sha256").update(hashString).digest("hex");

    // Add securityInfo to request body
    const requestBody = {
      ...body,
      securityInfo: transactionHash,
    };

    // Save all request body details before forwarding
    const adminClient = createAdminClient();
    const userId = body.user_id || null;
    // NOTE: This assumes a 'request_payload' JSONB or TEXT field exists in the transactions table.
    // If not, a migration is needed to add it.
    // Check for duplicate transaction by reference or transaction_hash
    const { data: duplicate, error: dupError } = await adminClient
      .from("transactions")
      .select("id")
      .or(`reference.eq.${body.transactionReference},transaction_hash.eq.${transactionHash}`)
      .maybeSingle();
    if (dupError) {
      console.error("Duplicate check error:", dupError);
      return NextResponse.json({ status: "error", message: "Database error during duplicate check" }, { status: 500 });
    }
    if (duplicate) {
      return NextResponse.json({ status: "error", message: "Duplicate transaction" }, { status: 400 });
    }

    // Insert the transaction before processing
    const transactionId = uuidv4();
    const { error: insertError } = await adminClient.from("transactions").insert({
      id: transactionId,
      user_id: userId || "5fa72eb9-2cdb-446c-9c3d-840c233d5105",
      amount: body.amount,
      type: "transfer",
      description: body.narration || "Client transfer",
      reference: body.transactionReference || transactionId,
      status: "initiated",
      created_at: new Date().toISOString(),
      transaction_hash: transactionHash,
    });
    if (insertError) {
      console.error("Transaction insert error:", insertError);
      return NextResponse.json(
        { status: "error", message: "Failed to save transaction", details: insertError.message },
        { status: 500 }
      );
    }

    // Forward request to Alat API (Process Client Transfer)
    const response = await fetch(
      "https://apiplayground.alat.ng/debit-wallet/api/Shared/ProcessClientTransfer",
      {
        method: "POST",
        headers: {
          access: process.env.ALAT_CHANNEL_ID!, // Channel Id
          "Ocp-Apim-Subscription-Key": process.env.PRIMARY_KEY!,
          "Content-Type": "application/json-patch+json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    // Update the transaction with the response details
    const updateFields = {
      status: data?.result?.status || (response.ok ? "success" : "failed"),
      reference: data?.result?.transactionReference || body.transactionReference || transactionId,
      updated_at: new Date().toISOString(),
      // Optionally add more fields from the response if needed
      original_txn_date: data?.result?.orinalTxnTransactionDate || "",
      platform_transaction_reference: data?.result?.platformTransactionReference || "",
      transaction_stan: data?.result?.transactionStan || "",
      message: data?.result?.message || "",
      narration: data?.result?.narration || ""
    };
    const { error: updateError } = await adminClient
      .from("transactions")
      .update(updateFields)
      .eq("id", transactionId);
    if (updateError) {
      console.error("Transaction update error:", updateError);
    }

    if (!response.ok) {
      return NextResponse.json(
        { status: "error", ...data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 