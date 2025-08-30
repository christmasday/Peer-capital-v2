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
        "Ocp-Apim-Subscription-Key": process.env.PRIMARY_KEY!,
        "Content-Type": "application/json-patch+json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
} 