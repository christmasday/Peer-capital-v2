import { NextResponse } from "next/server";
import { getBlockedUsers } from "@/lib/actions/connections";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { blocked } = await getBlockedUsers();
  if (!blocked || blocked.length === 0) {
    return NextResponse.json({ blocked: [] });
  }
  // Fetch profile info for each blocked user
  const adminClient = createAdminClient();
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, first_name, last_name, profile_picture_url")
    .in("id", blocked);
  const blockedUsers = (profiles || []).map((p: any) => ({
    id: p.id,
    name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.id,
    profilePictureUrl: p.profile_picture_url,
  }));
  return NextResponse.json({ blocked: blockedUsers });
} 