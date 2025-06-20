import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-middleware";

// This endpoint expects a query param ?accountNumber=...
export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req) as any;
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const accountNumber = searchParams.get("accountNumber");
    if (!accountNumber) {
      return NextResponse.json({ status: "error", message: "Missing accountNumber parameter" }, { status: 400 });
    }

    // Forward request to Alat API (Get Wallet Details)
    const response = await fetch(
      `https://apiplayground.alat.ng/ws-acct-mgt/api/AccountMaintenance/CustomerAccount/GetAccountV2/accountNumber/${encodeURIComponent(accountNumber)}`,
      {
        method: "GET",
        headers: {
          "x-api-key": process.env.ALAT_API_KEY!,
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