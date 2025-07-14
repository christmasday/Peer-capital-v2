import { NextResponse } from "next/server";
import { unblockUser } from "@/lib/actions/connections";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const result = await unblockUser(userId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
} 