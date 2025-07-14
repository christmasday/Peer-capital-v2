import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
//   const authResult = await verifyAuth(req) as any;
//   if (!authResult.authenticated) {
//     return NextResponse.json({ error: "Authentication required" }, { status: 401 });
//   }

  try {
    const body = await req.json();
    const { phoneNumber, otp, trackingId } = body;
    if (
      typeof phoneNumber !== "string" ||
      typeof otp !== "string" ||
      typeof trackingId !== "string" ||
      !phoneNumber.trim() ||
      !otp.trim() ||
      !trackingId.trim()
    ) {
      return NextResponse.json({ error: "phoneNumber, otp, and trackingId are required and must be non-empty strings." }, { status: 400 });
    }

    // Forward request to Alat API (Step 2)
    const response = await fetch(
      "https://apiplayground.alat.ng/wallet-creation/api/CustomerAccount/GenerateWalletAccountForPartnershipsV2/Otp",
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
        { status: "error", message: data.message || "Failed to validate OTP and enqueue account creation" },
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