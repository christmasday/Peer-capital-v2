import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { account_number, bank_code } = await req.json();
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ status: false, message: "Paystack secret key not configured" }, { status: 500 });
  }
  const res = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
} 