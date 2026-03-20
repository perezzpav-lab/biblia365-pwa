"use client";

import { Crown, Medal, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getAvatarByKey } from "@/lib/avatars";
import { getLevelFromXp } from "@/lib/levels";
import { supabase } from "@/lib/supabase";

type RankingScope = "global" | "weekly";

type RankingRow = {
  user_id: string;
  display_name: string;
  xp: number;
  rank: number;
};

type RawRow = Record<string, unknown>;

function extractDisplayName(row: RawRow): string {
  const explicit =
    (typeof row.display_name === "string" && row.display_name) ||
    (typeof row.username === "string" && row.username) ||
    (typeof row.name === "string" && row.name) ||
    "";
  if (explicit) return explicit;

  const email =
    (typeof row.email === "string" && row.email) ||
    (typeof row.user_email === "string" && row.user_email) ||
    "";
  if (email.includes("@")) return email.split("@")[0];
  if (email) return email;
  return "usuario";
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function normalizeRows(rows: RawRow[]): RankingRow[] {
  const mapped = rows.map((row, idx) => ({
    user_id:
      (typeof row.user_id === "string" && row.user_id) ||
      (typeof row.id === "string" && row.id) ||
      `anon-${idx}`,
    display_name: extractDisplayName(row),
    xp:
      toNumber(row.xp_total) ||
      toNumber(row.score) ||
      toNumber(row.xp) ||
      toNumber(row.points),
    rank: toNumber(row.rank) || idx + 1,
  }));

  return mapped
    .sort((a, b) => b.xp - a.xp)
    .map((item, idx) => ({
      ...item,
      rank: item.rank || idx + 1,
    }));
}

export default function RankingPage() {
  const [scope, setScope] = useState<RankingScope>("global");
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});
  const [isNightMode, setIsNightMode] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    };
    void getUser();
  }, []);

  useEffect(() => {
    const refresh = () => {
      const hour = new Date().getHours();
      setIsNightMode(hour >= 19 || hour < 6);
    };
    refresh();
    const interval = window.setInterval(refresh, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const source = scope === "global" ? "global_leaderboard" : "leaderboard_weekly";
      const { data, error: queryError } = await supabase.from(source).select("*");

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      setRows(normalizeRows((data ?? []) as RawRow[]));
      const userIds = (data ?? [])
        .map((row) => (typeof (row as RawRow).user_id === "string" ? ((row as RawRow).user_id as string) : null))
        .filter((id): id is string => Boolean(id));

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("user_id, avatar_key")
          .in("user_id", userIds)
          .returns<Array<{ user_id: string; avatar_key: string | null }>>();
        const map: Record<string, string> = {};
        for (const profile of profiles ?? []) {
          if (profile.avatar_key) map[profile.user_id] = profile.avatar_key;
        }
        setAvatarMap(map);
      } else {
        setAvatarMap({});
      }
      setLoading(false);
    };

    void load();
  }, [scope]);

  const podium = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);

  return (
    <div
      className={`min-h-screen px-4 py-8 ${
        isNightMode
          ? "bg-gradient-to-b from-slate-950 via-slate-900 to-gray-900 text-slate-100 dark"
          : "bg-gradient-to-b from-zinc-50 to-zinc-100 text-slate-900"
      }`}
    >
      <main className="mx-auto w-full max-w-2xl space-y-4">
        <section className={`rounded-3xl border p-6 shadow-xl ${isNightMode ? "border-zinc-700 bg-zinc-900/80" : "border-zinc-200 bg-white"}`}>
          <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-slate-100">Ranking</h1>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            Compite con amor y constancia. Tu progreso inspira a otros.
          </p>

          <div className={`mt-4 inline-flex rounded-full p-1 ${isNightMode ? "bg-zinc-800" : "bg-zinc-100"}`}>
            <button
              type="button"
              onClick={() => setScope("global")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                scope === "global" ? "bg-emerald-700 text-white" : isNightMode ? "text-zinc-300" : "text-zinc-700"
              }`}
            >
              Ranking Global
            </button>
            <button
              type="button"
              onClick={() => setScope("weekly")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                scope === "weekly" ? "bg-emerald-700 text-white" : isNightMode ? "text-zinc-300" : "text-zinc-700"
              }`}
            >
              Ranking Semanal
            </button>
          </div>
        </section>

        {loading ? (
          <section className={`rounded-3xl border p-6 text-sm shadow ${isNightMode ? "border-zinc-700 bg-zinc-900/80 text-zinc-300" : "border-zinc-200 bg-white text-zinc-600"}`}>
            Cargando ranking...
          </section>
        ) : error ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow">
            No se pudo cargar ranking: {error}
          </section>
        ) : (
          <>
            <section className={`rounded-3xl border p-6 shadow-xl ${isNightMode ? "border-zinc-700 bg-zinc-900/80" : "border-zinc-200 bg-white"}`}>
              <p className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Podio</p>
              <div className="grid grid-cols-3 gap-3">
                {podium.map((row, idx) => (
                  <div
                    key={`${row.user_id}-${idx}`}
                    className={`rounded-2xl border p-3 text-center ${
                      idx === 0
                        ? "border-yellow-300 bg-yellow-50"
                        : idx === 1
                          ? "border-zinc-300 bg-zinc-50"
                          : "border-amber-300 bg-amber-50"
                    }`}
                  >
                    <div className="mb-1 flex justify-center">
                      {idx === 0 ? (
                        <Crown className="h-5 w-5 text-yellow-600" />
                      ) : idx === 1 ? (
                        <Medal className="h-5 w-5 text-zinc-500" />
                      ) : (
                        <Trophy className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {getAvatarByKey(avatarMap[row.user_id]).emoji} {row.display_name}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {row.xp} XP · Nv. {getLevelFromXp(row.xp).level}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className={`rounded-3xl border p-4 shadow-xl ${isNightMode ? "border-zinc-700 bg-zinc-900/80" : "border-zinc-200 bg-white"}`}>
              <p className="mb-2 px-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Clasificación</p>
              <div className="space-y-2">
                {rest.length === 0 ? (
                  <p className="px-2 py-4 text-sm text-slate-500 dark:text-slate-400">Aún no hay más participantes.</p>
                ) : (
                  rest.map((row) => {
                    const isMe = currentUserId && row.user_id === currentUserId;
                    return (
                      <div
                        key={`${row.user_id}-${row.rank}`}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                          isMe
                            ? isNightMode
                              ? "border border-emerald-400/40 bg-emerald-900/20"
                              : "border border-emerald-300 bg-emerald-50"
                            : isNightMode
                              ? "bg-zinc-800/80"
                              : "bg-zinc-50"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            #{row.rank} · {getAvatarByKey(avatarMap[row.user_id]).emoji} {row.display_name}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            Nivel {getLevelFromXp(row.xp).level}: {getLevelFromXp(row.xp).title}
                          </p>
                          {isMe && <p className="text-[11px] text-emerald-700">Tu posición actual</p>}
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{row.xp} XP</p>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
