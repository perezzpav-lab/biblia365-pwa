"use client";

import { Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FAMILY_PROFILES_KEY, FAMILY_SELECTED_PROFILE_KEY } from "@/lib/family-types";

const BADGES_KEY = "biblia365_badges_v1";
const STICKERS_KEY = "biblia365_stickers_v1";
const XP_KEY = "biblia365_xp_v1";
const STORAGE_KEY = "biblia365_dias_completados_v1";

function profileScopedKey(base: string, profileId: string | null): string {
  return `${base}:${profileId ?? "global"}`;
}

type AnimalCard = {
  id: string;
  name: string;
  emoji: string;
  unlockRule: string;
  unlocked: boolean;
};

export default function ColeccionablesPage() {
  const [selectedProfileIsChild] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const sel = localStorage.getItem(FAMILY_SELECTED_PROFILE_KEY);
      const raw = localStorage.getItem(FAMILY_PROFILES_KEY);
      if (!raw || !sel) return false;
      const profiles = JSON.parse(raw) as { id: string; role?: string }[];
      if (!Array.isArray(profiles)) return false;
      return profiles.find((p) => p.id === sel)?.role === "child";
    } catch {
      return false;
    }
  });
  const [xp] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const selected = localStorage.getItem(FAMILY_SELECTED_PROFILE_KEY);
    const xpRaw = localStorage.getItem(profileScopedKey(XP_KEY, selected));
    return Number(xpRaw ?? 0);
  });
  const [days] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const selected = localStorage.getItem(FAMILY_SELECTED_PROFILE_KEY);
      return JSON.parse(localStorage.getItem(profileScopedKey(STORAGE_KEY, selected)) ?? "[]") as number[];
    } catch {
      return [];
    }
  });
  const [badges] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const selected = localStorage.getItem(FAMILY_SELECTED_PROFILE_KEY);
      return JSON.parse(localStorage.getItem(profileScopedKey(BADGES_KEY, selected)) ?? "[]") as string[];
    } catch {
      return [];
    }
  });
  const [stickers] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const selected = localStorage.getItem(FAMILY_SELECTED_PROFILE_KEY);
      return JSON.parse(localStorage.getItem(profileScopedKey(STICKERS_KEY, selected)) ?? "[]") as string[];
    } catch {
      return [];
    }
  });
  const [isNightMode, setIsNightMode] = useState(() => {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 6;
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      const hour = new Date().getHours();
      setIsNightMode((prev) => {
        const next = hour >= 19 || hour < 6;
        return prev === next ? prev : next;
      });
    }, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const animals = useMemo<AnimalCard[]>(
    () => [
      { id: "lion", name: "León del Arca", emoji: "🦁", unlockRule: "10 XP", unlocked: xp >= 10 },
      { id: "dove", name: "Paloma de Paz", emoji: "🕊️", unlockRule: "1 día leído", unlocked: days.length >= 1 },
      { id: "giraffe", name: "Jirafa de Esperanza", emoji: "🦒", unlockRule: "3 días leídos", unlocked: days.length >= 3 },
      { id: "elephant", name: "Elefante de Fortaleza", emoji: "🐘", unlockRule: "7 días leídos", unlocked: days.length >= 7 },
      { id: "zebra", name: "Cebra de Obediencia", emoji: "🦓", unlockRule: "1 insignia", unlocked: badges.length >= 1 },
      { id: "kangaroo", name: "Canguro de Gozo", emoji: "🦘", unlockRule: "2 stickers", unlocked: stickers.length >= 2 },
      { id: "panda", name: "Panda de Ternura", emoji: "🐼", unlockRule: "100 XP", unlocked: xp >= 100 },
      { id: "rainbow", name: "Arcoíris del Pacto", emoji: "🌈", unlockRule: "30 días leídos", unlocked: days.length >= 30 },
    ],
    [badges.length, days.length, stickers.length, xp],
  );

  const unlockedCount = animals.filter((a) => a.unlocked).length;

  return (
    <div
      className={`min-h-screen px-4 py-8 ${
        isNightMode
          ? "bg-gradient-to-b from-slate-950 via-slate-900 to-gray-900 text-slate-100 dark"
          : "bg-gradient-to-b from-amber-50 via-white to-sky-50 text-slate-900"
      }`}
    >
      <main className="mx-auto w-full max-w-4xl space-y-4">
        <section className={`rounded-3xl border p-6 shadow-xl ${isNightMode ? "border-zinc-700 bg-zinc-900/80" : "border-amber-200 bg-white"}`}>
          <p className="text-sm font-semibold text-amber-700">Álbum de cartas coleccionables</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {selectedProfileIsChild ? "Animalitos del Arca de Noé" : "Mis Coleccionables"}
          </h1>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            Has desbloqueado {unlockedCount} de {animals.length} cartas.
          </p>
          <div className="mt-3 h-2.5 w-full rounded-full bg-black/10">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-emerald-500"
              style={{ width: `${(unlockedCount / animals.length) * 100}%` }}
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {animals.map((animal) => (
            <article
              key={animal.id}
              className={`rounded-2xl border p-4 shadow ${
                animal.unlocked
                  ? isNightMode
                    ? "border-emerald-300/50 bg-emerald-900/20"
                    : "border-emerald-200 bg-emerald-50"
                  : isNightMode
                    ? "border-zinc-700 bg-zinc-900/70"
                    : "border-zinc-200 bg-zinc-100"
              }`}
            >
              <p className="text-3xl">{animal.unlocked ? animal.emoji : "❔"}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {animal.unlocked ? animal.name : "Carta bloqueada"}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {animal.unlocked ? "¡Desbloqueada!" : `Meta: ${animal.unlockRule}`}
              </p>
              {animal.unlocked && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                  <Star className="h-3 w-3" />
                  Coleccionada
                </p>
              )}
            </article>
          ))}
        </section>

        <section className={`rounded-3xl border p-4 ${isNightMode ? "border-zinc-700 bg-zinc-900/80" : "border-sky-200 bg-sky-50/70"}`}>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Consejo Pro
          </p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            Lee tu capítulo y completa al menos un minijuego por día para desbloquear cartas más rápido.
          </p>
        </section>
      </main>
    </div>
  );
}
