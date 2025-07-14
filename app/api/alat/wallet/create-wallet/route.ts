import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
 // const authResult = await verifyAuth(req) as any;
//  if (!authResult.authenticated) {
//    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
//  }

  try {
    const body = await req.json();

    // Forward request to Alat API (Step 1)
    const response = await fetch(
      "https://apiplayground.alat.ng/wallet-creation/api/CustomerAccount/GenerateWalletAccountForPartnerships/Request",
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

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return NextResponse.json(
        { status: "error", message: `Alat API did not return valid JSON. Raw response: ${rawText}` },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { status: "error", message: data.message || "Failed to create wallet", raw: data },
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