import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { phone, otp } = await req.json();
  if (!phone || !otp) {
    return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
  }

  const res = await fetch('https://api.dojah.io/api/v1/messaging/otp/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'AppId': process.env.DOJAH_APP_ID!,
      'Authorization': `Bearer ${process.env.DOJAH_API_KEY}`,
    },
    body: JSON.stringify({ phone_number: phone, otp }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
} 