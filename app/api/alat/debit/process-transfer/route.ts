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
    /*const requiredFields = [
      "transactionReference",
      "amount",
      "timestamp",
      "sourceAccountNumber",
      "destinationAccountNumber",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }*/

    // Generate transaction hash
    const hashString = `${body.transactionReference}|${body.amount}|${body.timestamp}|${body.sourceAccountNumber}|${body.destinationAccountNumber}`;
    const transactionHash = crypto.createHash("sha256").update(hashString).digest("hex");

    // Add securityInfo to request body
    const requestBody = {
      ...body,
      securityInfo: transactionHash,
    };

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

    // Save to database if successful
    if (response.ok && data?.result) {
      const adminClient = createAdminClient();
      // Try to get user_id from the request (if available)
      const userId = body.user_id || null;
      await adminClient.from("transactions").insert({
        id: uuidv4(),
        user_id: userId,
        amount: body.amount,
        type: "transfer",
        description: body.narration || "Client transfer via Alat API",
        reference: data.result.transactionReference || body.transactionReference || uuidv4(),
        status: data.result.status || "pending",
        created_at: new Date().toISOString(),
        transaction_hash: transactionHash,
      });
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