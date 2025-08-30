import { NextResponse } from "next/server";
import { blockUser } from "@/lib/actions/connections";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const result = await blockUser(userId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
} 