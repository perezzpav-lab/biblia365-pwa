import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

type WeeklyRow = {
  user_id: string;
  xp_total?: number | null;
  xp?: number | null;
  score?: number | null;
};

function getSeasonKey(now: Date): string {
  const year = now.getUTCFullYear();
  const firstDay = new Date(Date.UTC(year, 0, 1));
  const diffMs = now.getTime() - firstDay.getTime();
  const week = Math.ceil((diffMs / 86400000 + firstDay.getUTCDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const incoming =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : request.headers.get("x-cron-secret");
  if (!secret || incoming !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const now = new Date();
  const seasonKey = getSeasonKey(now);

  const { data, error } = await supabaseAdmin
    .from("leaderboard_weekly")
    .select("*")
    .returns<WeeklyRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const top3 = (data ?? [])
    .map((row) => ({
      user_id: row.user_id,
      xp_total: Number(row.xp_total ?? row.xp ?? row.score ?? 0),
    }))
    .sort((a, b) => b.xp_total - a.xp_total)
    .slice(0, 3);

  for (let i = 0; i < top3.length; i += 1) {
    await supabaseAdmin.from("seasonal_winners").insert({
      season_key: seasonKey,
      position: i + 1,
      user_id: top3[i].user_id,
      xp_total: top3[i].xp_total,
      created_at: now.toISOString(),
    });
  }

  const resetPayloads = [
    { xp_total: 0, updated_at: now.toISOString() },
    { xp: 0, updated_at: now.toISOString() },
    { score: 0, updated_at: now.toISOString() },
  ];

  let resetSuccess = false;
  for (const payload of resetPayloads) {
    const { error: resetError } = await supabaseAdmin
      .from("leaderboard_weekly")
      .update(payload)
      .gt("user_id", "");
    if (!resetError) {
      resetSuccess = true;
      break;
    }
  }

  return NextResponse.json({
    ok: true,
    seasonKey,
    winnersSaved: top3.length,
    weeklyReset: resetSuccess,
  });
}
