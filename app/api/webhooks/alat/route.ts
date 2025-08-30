import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  
  try {
    const payload = await req.json();
    const adminClient = createAdminClient();

    // Log the webhook event for auditing
    await adminClient.from("webhook_events").insert({
      event_type: "alat.debit_transaction_status",
      payload,
      created_at: new Date().toISOString(),
    });

    // Extract transaction reference and status
    const result = payload.result || {};
    const data = result.data || {};
    const transactionReference = data.transactionReference;
    const status = data.status;
    const message = data.message;
    const narration = data.narration;
    const platformTransactionReference = data.platformTransactionReference;
    const transactionStan = data.transactionStan;
    const originalTxnDate = data.orinalTxnTransactionDate;

    if (!transactionReference || !status) {
      return NextResponse.json({ error: "Missing transactionReference or status in payload" }, { status: 400 });
    }

    // Update the transaction in the database
    const { error: updateError } = await adminClient
      .from("transactions")
      .update({
        status,
        message,
        narration,
        platform_transaction_reference: platformTransactionReference,
        transaction_stan: transactionStan,
        original_txn_date: originalTxnDate,
        updated_at: new Date().toISOString(),
      })
      .eq("reference", transactionReference);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Malformed webhook payload" }, { status: 400 });
  }
} 