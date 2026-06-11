import { NextRequest, NextResponse } from 'next/server';
import { getDojahApiUrl, getDojahSecretKey } from '../../../../lib/dojah';

export async function POST(req: NextRequest) {
  const { phone, otp } = await req.json();
  if (!phone || !otp) {
    return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
  }

  const secretKey = getDojahSecretKey();
  if (!process.env.DOJAH_APP_ID || !secretKey) {
    return NextResponse.json({ error: 'Dojah credentials are not configured' }, { status: 500 });
  }

  const res = await fetch(getDojahApiUrl('/api/v1/messaging/otp/validate'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'AppId': process.env.DOJAH_APP_ID!,
      'Authorization': secretKey,
    },
    body: JSON.stringify({ phone_number: phone, otp }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
} 