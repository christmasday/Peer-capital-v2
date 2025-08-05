import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-middleware";

// This endpoint expects query params ?bankCode=...&accountNumber=...
export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req) as any;
   if (!authResult.authenticated) {
     return NextResponse.json({ error: "Authentication required" }, { status: 401 });
   }

  try {
    const { searchParams } = new URL(req.url);
    const bankCode = searchParams.get("bankCode");
    const accountNumber = searchParams.get("accountNumber");
    if (!bankCode || !accountNumber) {
      return NextResponse.json({ status: "error", message: "Missing bankCode or accountNumber parameter" }, { status: 400 });
    }

    // Forward request to Alat API (Account Name Enquiry - destination)
    const response = await fetch(
      `https://apiplayground.alat.ng/debit-wallet/api/Shared/AccountNameEnquiry/${encodeURIComponent(bankCode)}/${encodeURIComponent(accountNumber)}`,
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