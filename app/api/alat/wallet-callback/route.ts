import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/actions/notifications";
import { verifyAuth } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
 
  try {
    const payload = await req.json();
    const adminClient = createAdminClient();

    // Extract info from payload
    const trackingId = payload.trackingId || payload.tracking_id;
    const status = payload.status || payload.accountStatus || "active";
    let userId = payload.userId || payload.user_id;

    // If userId is not present, try to look up by trackingId
    if (!userId && trackingId) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("alat_wallet_tracking_id", trackingId)
        .maybeSingle();
      if (profile) {
        userId = profile.id;
      }
    }

    // Persist callback data
    await adminClient.from("alat_wallet_callbacks").insert({
      user_id: userId,
      tracking_id: trackingId,
      status,
      payload,
    });

    // Update user profile (if userId is available)
    if (userId) {
      await adminClient.from("profiles").update({
        alat_wallet_status: status,
        alat_wallet_tracking_id: trackingId,
      }).eq("id", userId);
    }

    // Notify user
    if (userId) {
      await createNotification({
        userId,
        type: "account_created",
        data: {
          status,
          trackingId,
          message: "Your Alat wallet has been created and is now active.",
        },
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("[ALAT WALLET CALLBACK ERROR]", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Malformed callback payload" },
      { status: 400 }
    );
  }
} 