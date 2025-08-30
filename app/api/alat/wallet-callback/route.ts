import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/actions/notifications";

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req) as any;
  if (!authResult.authenticated) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

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

    // Handle alat face verification response
    if (
      typeof payload === "object" &&
      payload.success === true &&
      payload.c_id &&
      payload.id &&
      payload.id_type &&
      (payload.id_type === "bvn" || payload.id_type === "nin")
    ) {
      // Find user by bvn or nin
      let userField = payload.id_type === "bvn" ? "bvn" : "nin";
      const { data: profile } = await adminClient
        .from("profiles")
        .select("id")
        .eq(userField, payload.id)
        .maybeSingle();
      if (profile && profile.id) {
        await adminClient.from("profiles").update({
          correlation_id: payload.c_id,
          bvn: payload.id_type === "bvn" ? payload.id : undefined,
          nin: payload.id_type === "nin" ? payload.id : undefined,
          alat_face_verified: true,
          alat_face_verified_at: new Date().toISOString(),
        }).eq("id", profile.id);
        return NextResponse.json({ status: "ok" });
      } else {
        return NextResponse.json({ status: "error", message: "User not found for provided id" }, { status: 404 });
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