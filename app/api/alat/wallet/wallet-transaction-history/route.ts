import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req) as any;
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.accountNumber) {
      return NextResponse.json({ status: "error", message: "Missing accountNumber in request body" }, { status: 400 });
    }

    // Forward request to Alat API (Transaction History)
    const response = await fetch(
      "https://apiplayground.alat.ng/ws-acct-mgt/api/AccountMaintenance/CustomerAccount/transhistoryV2",
      {
        method: "POST",
        headers: {
          "x-api-key": process.env.ALAT_API_KEY!,
          "Ocp-Apim-Subscription-Key": process.env.PRIMARY_KEY!,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(body),
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