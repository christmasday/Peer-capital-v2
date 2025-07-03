import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-middleware";

export async function GET(req: NextRequest) {
  
  try {
    // Forward request to Alat API (Get All Banks)
    const response = await fetch(
      "https://apiplayground.alat.ng/debit-wallet/api/Shared/GetAllBanks",
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