import { NextRequest, NextResponse } from "next/server";
import { validateAccountWithPaystack } from "@/lib/actions/paystack";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account_number, bank_code, bvn } = body;
    if (!account_number || !bank_code || !bvn) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    const result = await validateAccountWithPaystack({ account_number, bank_code, bvn });
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
} 