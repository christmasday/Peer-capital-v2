import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req) as any;
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const response = await fetch("https://apiplayground.alat.ng/credit-wallet/api/IntraBankTransfer/FundWallet", {
      method: "POST",
      headers: {
        access: process.env.ALAT_CHANNEL_ID!,
        "Content-Type": "application/json-patch+json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.text();
    // Try to parse as JSON, fallback to plain text
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = data;
    }
    return NextResponse.json(parsed, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
} 