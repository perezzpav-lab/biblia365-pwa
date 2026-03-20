import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/server/admin-auth";
import { sendPushNotification } from "@/lib/server/push";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

type PushSendBody = {
  title: string;
  body: string;
  target: "all" | "timezone";
  timezone?: string;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
};

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdminUser(request);
    const supabaseAdmin = getSupabaseAdmin();
    const payload = (await request.json()) as PushSendBody;

    if (!payload.title || !payload.body) {
      return NextResponse.json({ error: "Título y mensaje son obligatorios." }, { status: 400 });
    }

    if (payload.target === "timezone" && !payload.timezone) {
      return NextResponse.json({ error: "Zona horaria requerida." }, { status: 400 });
    }

    let query = supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, timezone")
      .eq("enabled", true);

    if (payload.target === "timezone" && payload.timezone) {
      query = query.eq("timezone", payload.timezone);
    }

    const { data, error } = await query.returns<PushSubscriptionRow[]>();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let sent = 0;
    let removed = 0;
    for (const row of data ?? []) {
      try {
        await sendPushNotification(
          {
            endpoint: row.endpoint,
            expirationTime: null,
            keys: {
              p256dh: row.p256dh,
              auth: row.auth,
            },
          },
          {
            title: payload.title,
            body: payload.body,
            url: "/",
            source: "manual_admin",
          },
        );
        sent += 1;
      } catch (errorPush) {
        const message = String(errorPush);
        if (message.includes("410") || message.includes("404")) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", row.id);
          removed += 1;
        }
      }
    }

    await supabaseAdmin.from("app_events").insert({
      user_id: adminUser.id,
      event_name: "admin_manual_push",
      metadata: {
        target: payload.target,
        timezone: payload.timezone ?? null,
        sent,
        removed,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, sent, removed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No autorizado";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
