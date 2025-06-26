import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req) as any;
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Forward request to Alat API (Resend OTP)
    const response = await fetch(
      "https://playground.alat.ng/wallet-creation/api/CustomerAccount/ResendOtpRequest/ResendOtp",
      {
        method: "POST",
        headers: {
          "x-api-key": process.env.ALAT_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { status: "error", message: data.message || "Failed to resend OTP" },
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