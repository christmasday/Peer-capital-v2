import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-middleware";

// This endpoint expects a query param ?clientTransactionReference=...
export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req) as any;
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const clientTransactionReference = searchParams.get("clientTransactionReference");
    if (!clientTransactionReference) {
      return NextResponse.json({ status: "error", message: "Missing clientTransactionReference parameter" }, { status: 400 });
    }

    // Forward request to Alat API (Confirm Client Transaction Status)
    const response = await fetch(
      `https://apiplayground.alat.ng/debit-wallet/api/IntraBankTransfer/ConfirmClientTransferStatus/${encodeURIComponent(clientTransactionReference)}`,
      {
        method: "GET",
        headers: {
          access: process.env.ALAT_CHANNEL_ID!, // Channel Id
          "Ocp-Apim-Subscription-Key": process.env.PRIMARY_KEY!,
          "Cache-Control": "no-cache", 
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

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