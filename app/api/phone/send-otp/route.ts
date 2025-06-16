import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
  }

  const res = await fetch('https://api.dojah.io/api/v1/messaging/otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'AppId': process.env.DOJAH_APP_ID!,
      'Authorization': `Bearer ${process.env.DOJAH_API_KEY}`,
    },
    body: JSON.stringify({ phone_number: phone, channel: 'sms' }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
} 