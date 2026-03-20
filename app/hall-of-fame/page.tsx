"use client";

import { motion } from "framer-motion";
import { Crown, Medal, Share2, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type WinnerRow = {
  id: string;
  season_key: string;
  position: number;
  user_id: string | null;
  xp_total: number;
  created_at: string;
};

const medals: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export default function HallOfFamePage() {
  const [winners, setWinners] = useState<WinnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("seasonal_winners")
        .select("id, season_key, position, user_id, xp_total, created_at")
        .order("created_at", { ascending: false })
        .limit(120);

      if (error) {
        setStatus("No se pudo cargar el Hall of Fame.");
        setLoading(false);
        return;
      }
      setWinners((data ?? []) as WinnerRow[]);
      setLoading(false);
    };
    void load();
  }, []);

  const bySeason = useMemo(() => {
    const map = new Map<string, WinnerRow[]>();
    for (const row of winners) {
      const current = map.get(row.season_key) ?? [];
      current.push(row);
      map.set(row.season_key, current);
    }
    return Array.from(map.entries()).map(([seasonKey, rows]) => ({
      seasonKey,
      rows: rows.sort((a, b) => a.position - b.position),
    }));
  }, [winners]);

  const shareVictory = async (seasonKey: string, row: WinnerRow) => {
    const nick = row.user_id ? `Jugador ${row.user_id.slice(0, 6)}` : "Campeón";
    const text = `Hall of Fame Biblia365\n${medals[row.position] ?? "🏅"} ${nick} - Puesto ${row.position}\nTemporada ${seasonKey}\nXP: ${row.xp_total}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-yellow-50 px-4 py-8">
      <main className="mx-auto w-full max-w-3xl space-y-4">
        <section className="rounded-3xl border border-amber-200 bg-white/90 p-6 shadow-xl backdrop-blur">
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-zinc-900">
            <Trophy className="h-6 w-6 text-amber-600" />
            Hall of Fame
          </h1>
          <p className="mt-1 text-sm text-zinc-600">Ganadores históricos por temporada semanal.</p>
        </section>

        {loading ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow">
            Cargando campeones...
          </section>
        ) : status ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow">
            {status}
          </section>
        ) : bySeason.length === 0 ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow">
            Aún no hay temporadas cerradas.
          </section>
        ) : (
          bySeason.map((season, idx) => (
            <motion.section
              key={season.seasonKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="relative overflow-hidden rounded-3xl border border-amber-200 bg-white p-5 shadow-xl"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-amber-200/60 to-transparent blur-xl" />
              <p className="mb-3 text-sm font-semibold text-zinc-700">Temporada {season.seasonKey}</p>
              <div className="space-y-2">
                {season.rows.map((row) => {
                  const nick = row.user_id ? `jugador_${row.user_id.slice(0, 6)}` : "anonimo";
                  return (
                    <div
                      key={row.id}
                      className="flex items-center justify-between rounded-2xl border border-amber-100 bg-gradient-to-r from-white to-amber-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{medals[row.position] ?? "🏅"}</span>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">
                            {row.position === 1 && <Crown className="mr-1 inline h-4 w-4 text-amber-600" />}
                            {nick}
                          </p>
                          <p className="text-xs text-zinc-600">XP {row.xp_total}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void shareVictory(season.seasonKey, row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Compartir Victoria
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-amber-700">
                <Medal className="h-3.5 w-3.5" />
                Campeones semanales de Biblia365
              </div>
            </motion.section>
          ))
        )}
      </main>
    </div>
  );
}
