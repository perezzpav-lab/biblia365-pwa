import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/server/push";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  reminder_time: string;
  timezone: string;
  user_id: string;
};

function currentTimeInZone(timeZone: string): string {
  const now = new Date();
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(now);
}

export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const incoming =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : request.headers.get("x-cron-secret");

  if (!secret || incoming !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, reminder_time, timezone, user_id")
    .eq("enabled", true)
    .returns<PushSubscriptionRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let removed = 0;

  for (const row of data ?? []) {
    const tz = row.timezone || "UTC";
    const nowInTz = currentTimeInZone(tz);
    if (nowInTz !== row.reminder_time) continue;

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
          title: "Biblia 365 📖",
          body: "¡Bienvenido a Biblia 365! Tu aventura en la Palabra comienza hoy. ¡Dios te bendiga!",
          url: "/",
        },
      );
      sent += 1;
    } catch (errorPush) {
      const errorMessage = String(errorPush);
      if (errorMessage.includes("410") || errorMessage.includes("404")) {
        await supabaseAdmin.from("push_subscriptions").delete().eq("id", row.id);
        removed += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, sent, removed });
}
