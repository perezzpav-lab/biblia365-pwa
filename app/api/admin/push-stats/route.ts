import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/server/admin-auth";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

type SubscriptionRow = {
  timezone: string;
  reminder_time: string;
};

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("timezone, reminder_time")
      .eq("enabled", true)
      .returns<SubscriptionRow[]>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const byTimezone: Record<string, number> = {};
    const byReminderTime: Record<string, number> = {};

    for (const row of data ?? []) {
      byTimezone[row.timezone] = (byTimezone[row.timezone] ?? 0) + 1;
      byReminderTime[row.reminder_time] = (byReminderTime[row.reminder_time] ?? 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      totalEnabledSubscriptions: (data ?? []).length,
      byTimezone,
      byReminderTime,
      remindersReady: true,
      cronPath: "/api/cron/push-reminders",
      cronHeader: "x-cron-secret",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No autorizado";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
