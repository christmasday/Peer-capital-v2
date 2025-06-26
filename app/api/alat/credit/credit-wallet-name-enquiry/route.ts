import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-middleware";

export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req) as any;
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const accountNumber = searchParams.get("accountNumber");
    if (!accountNumber) {
      return NextResponse.json({ error: "Missing accountNumber parameter" }, { status: 400 });
    }

    const url = `https://apiplayground.alat.ng/credit-wallet/api/Shared/AccountNameEnquiry/Wallet/${encodeURIComponent(accountNumber)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        access: process.env.ALAT_CHANNEL_ID!,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
} 