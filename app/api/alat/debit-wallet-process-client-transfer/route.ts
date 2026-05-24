import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";
import { verifyAuth } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req) as any;
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Forward request to Alat API (Process Client Transfer)
    const response = await fetch(
      "https://apiplayground.alat.ng/debit-wallet/api/Shared/ProcessClientTransfer",
      {
        method: "POST",
        headers: {
          access: process.env.ALAT_CHANNEL_ID!, // Channel Id
          "Content-Type": "application/json-patch+json",
        },
        body: JSON.stringify(body),
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