import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

type SubscribeBody = {
  subscription: {
    endpoint: string;
    expirationTime: number | null;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  reminderTime: string;
  timezone: string;
};

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return NextResponse.json({ error: "Variables Supabase incompletas." }, { status: 500 });
    }

    const supabaseAuth = createClient(url, anon);
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Token inválido." }, { status: 401 });
    }

    const body = (await request.json()) as SubscribeBody;
    if (!body?.subscription?.endpoint || !body.subscription.keys?.p256dh || !body.subscription.keys?.auth) {
      return NextResponse.json({ error: "Suscripción push inválida." }, { status: 400 });
    }

    if (!isValidTime(body.reminderTime)) {
      return NextResponse.json({ error: "Hora de recordatorio inválida." }, { status: 400 });
    }

    const timezone = body.timezone || "UTC";

    const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
      {
        user_id: authData.user.id,
        endpoint: body.subscription.endpoint,
        p256dh: body.subscription.keys.p256dh,
        auth: body.subscription.keys.auth,
        reminder_time: body.reminderTime,
        timezone,
        enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar la suscripción." }, { status: 500 });
  }
}
