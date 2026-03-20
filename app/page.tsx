"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpenText,
  CheckCircle2,
  Cloud,
  CloudAlert,
  CloudOff,
  Flame,
  Loader2,
  LogOut,
  Share2,
  Sparkles,
  Thermometer,
  User,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import ReadingAudioPlayer from "@/components/ReadingAudioPlayer";
import SettingsPanel from "@/components/SettingsPanel";
import MiniGamesHub from "@/components/MiniGamesHub";
import SplashScreen from "@/components/SplashScreen";
import DailyVerseCard from "@/components/DailyVerseCard";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import ModeSwitcher, { type ModoLectura } from "@/components/home/ModeSwitcher";
import {
  cacheReading,
  clearCachedReadings,
  getCachedReading,
  pruneCachedReadings,
  type CachedReading,
} from "@/lib/offline-cache";
import { supabase } from "@/lib/supabase";
import {
  clearSyncQueueByUser,
  getQueueByUser,
  removeSyncItem,
} from "@/lib/sync-queue";
import { logAppEvent } from "@/lib/telemetry";
import { getAvatarByKey } from "@/lib/avatars";
import { getLevelFromXp } from "@/lib/levels";
import { formatBibleRoute } from "@/lib/bible-reference";
import { getSeasonByDay } from "@/lib/plan-seasons";
import {
  clearProfileQueue,
  getProfileQueue,
  pushProfileQueue,
  removeProfileQueueItem,
  type ProfileStatsPayload,
} from "@/lib/profile-sync-queue";
import {
  createDefaultFamilyProfiles,
  FAMILY_NAME_KEY,
  FAMILY_PROFILES_KEY,
  FAMILY_SELECTED_PROFILE_KEY,
  type FamilyProfile,
} from "@/lib/family-types";
import { fetchFamilyForUser, upsertFamilyForUser } from "@/lib/family-supabase";

type PlanBiblico = {
  id_dia: number;
  titulo: string;
  pasaje: string;
  reflexion_adulto: string;
  reflexion_nino: string;
};

type Pregunta = {
  id: string;
  id_dia: number;
  pregunta: string;
  opciones: Record<string, string>;
  respuesta_correcta: string;
  explicacion: string;
};

type BadgeKey = "racha_7_dias" | "racha_30_dias" | "primer_libro_completado";
type DailyActivityPayload = {
  user_id: string;
  id_dia: number;
  mode: ModoLectura;
  completed: boolean;
  updated_at: string;
  streak_value: number;
};
type SupabaseDebugInfo = {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
  source: string;
};

type ThemePreference = "auto" | "light" | "dark";

type Sticker = {
  id: string;
  name: string;
  emoji: string;
  unlocked: boolean;
};

const STORAGE_KEY = "biblia365_dias_completados_v1";
const ONBOARDING_KEY = "hasSeenOnboarding";
const DEFAULT_MODE_KEY = "biblia365_default_mode";
const LOCAL_STREAK_KEY = "biblia365_local_streak";
const LOCAL_LAST_ACTIVITY_AT_KEY = "biblia365_local_last_activity_at";
const BADGES_KEY = "biblia365_badges_v1";
const XP_KEY = "biblia365_xp_v1";
const STICKERS_KEY = "biblia365_stickers_v1";
const THEME_PREF_KEY = "biblia365_theme_pref";
const PROFILE_UPDATED_AT_KEY = "biblia365_profile_updated_at";
const GAME_WIN_DAYS_KEY = "biblia365_game_win_days";

const THEMES: Record<
  ModoLectura,
  {
    pageBg: string;
    card: string;
    mutedCard: string;
    heading: string;
    body: string;
    accent: string;
    accentSoft: string;
    pillTrack: string;
    pillThumb: string;
    activeText: string;
    inactiveText: string;
    reflectionLabel: string;
    practicalLabel: string;
    prayerLabel: string;
    practicalText: string;
    prayerText: string;
  }
> = {
  adulto: {
    pageBg: "bg-gradient-to-b from-stone-50 via-stone-100 to-slate-100 text-slate-900",
    card: "bg-white border border-stone-200",
    mutedCard: "bg-stone-50 border border-stone-200",
    heading: "font-serif",
    body: "text-slate-700",
    accent: "bg-emerald-700 text-white",
    accentSoft: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    pillTrack: "bg-stone-100",
    pillThumb: "bg-emerald-700",
    activeText: "text-white",
    inactiveText: "text-slate-600",
    reflectionLabel: "Reflexión para el corazón",
    practicalLabel: "Aplicación práctica",
    prayerLabel: "Oración sugerida",
    practicalText: "Elige una frase del pasaje y conviértela en una decisión concreta para hoy.",
    prayerText: "Señor, abre mis ojos para obedecer tu Palabra y reflejar tu amor en cada acción.",
  },
  joven: {
    pageBg: "bg-gradient-to-b from-violet-50 via-fuchsia-50 to-emerald-50 text-slate-900",
    card: "bg-white/95 border border-violet-200",
    mutedCard: "bg-white border border-fuchsia-200",
    heading: "font-sans font-bold",
    body: "text-slate-700",
    accent: "bg-gradient-to-r from-violet-600 to-emerald-500 text-white",
    accentSoft: "bg-violet-50 text-violet-800 border border-violet-200",
    pillTrack: "bg-violet-100",
    pillThumb: "bg-gradient-to-r from-violet-600 to-emerald-500",
    activeText: "text-white",
    inactiveText: "text-violet-700",
    reflectionLabel: "Reflexión para avanzar",
    practicalLabel: "Aplicación real",
    prayerLabel: "Oración de enfoque",
    practicalText: "Comparte una verdad de este pasaje con alguien y aplica un cambio en tu rutina.",
    prayerText: "Jesús, guía mis decisiones hoy y dame valentía para vivir lo que acabo de leer.",
  },
  nino: {
    pageBg: "bg-gradient-to-b from-sky-50 via-rose-50 to-amber-50 text-slate-900",
    card: "bg-white border border-sky-200 rounded-[2rem]",
    mutedCard: "bg-sky-50 border border-sky-200 rounded-[2rem]",
    heading: "font-sans font-bold",
    body: "text-slate-700",
    accent: "bg-gradient-to-r from-sky-500 to-emerald-500 text-white",
    accentSoft: "bg-amber-50 text-amber-900 border border-amber-200",
    pillTrack: "bg-sky-100",
    pillThumb: "bg-gradient-to-r from-sky-500 to-emerald-500",
    activeText: "text-white",
    inactiveText: "text-sky-700",
    reflectionLabel: "¿Qué nos enseña Jesús hoy?",
    practicalLabel: "Misión práctica",
    prayerLabel: "Oración cortita",
    practicalText: "Haz una acción bonita hoy: ayudar, compartir o decir una palabra amable.",
    prayerText: "Jesús, ayúdame a obedecerte y amar a los demás con alegría. Amén.",
  },
};

function esAnioBisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

function normalizarDias(dias: number[], diasTotales: number): number[] {
  return Array.from(
    new Set(dias.filter((dia) => Number.isInteger(dia) && dia >= 1 && dia <= diasTotales)),
  ).sort((a, b) => a - b);
}

function getSuggestedDay(completedDays: number[], diasTotales: number): number {
  if (completedDays.length === 0) return 1;
  const maxCompleted = Math.max(...completedDays);
  return Math.min(diasTotales, maxCompleted + 1);
}

function isSameDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function computeNextStreak(
  lastUpdatedAt: string | null,
  lastStreakValue: number,
  now: Date,
): number {
  if (!lastUpdatedAt) return 1;
  const lastDate = new Date(lastUpdatedAt);

  if (isSameDay(lastDate, now)) {
    return Math.max(1, lastStreakValue);
  }

  const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
  if (diffHours > 48) return 1;
  return Math.max(1, lastStreakValue + 1);
}

function unlockedBadges(streak: number, completedCount: number): BadgeKey[] {
  const badges: BadgeKey[] = [];
  if (streak >= 7) badges.push("racha_7_dias");
  if (streak >= 30) badges.push("racha_30_dias");
  if (completedCount >= 50) badges.push("primer_libro_completado");
  return badges;
}

function mapSyncError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
  const msg = raw.toLowerCase();
  const supabaseCode =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  if (msg.includes("does not exist") || msg.includes("relation")) {
    return "Sincronización falló: falta una tabla en Supabase (por ejemplo daily_activity, user_badges o user_progress).";
  }
  if (
    msg.includes("permission denied") ||
    msg.includes("row-level security") ||
    msg.includes("not authorized") ||
    msg.includes("42501")
  ) {
    return "Sincronización falló: permisos/RLS insuficientes para tu usuario en Supabase.";
  }
  if (msg.includes("jwt") || msg.includes("token")) {
    return "Sincronización falló: sesión expirada o token inválido. Cierra sesión y vuelve a entrar.";
  }
  if (msg.includes("network") || msg.includes("failed to fetch")) {
    return "Sincronización falló: problema de conexión a internet.";
  }

  return `Sincronización falló${supabaseCode ? ` (${supabaseCode})` : ""}: ${raw}`;
}

function buildDailyActivityPayload(input: {
  userId: string;
  day: number;
  mode: ModoLectura;
  updatedAt: string;
  streakValue: number;
}): DailyActivityPayload {
  return {
    user_id: input.userId,
    id_dia: input.day,
    mode: input.mode,
    completed: true,
    updated_at: input.updatedAt,
    streak_value: input.streakValue,
  };
}

function toDebugInfo(error: unknown, source: string): SupabaseDebugInfo {
  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      source,
      code: typeof record.code === "string" ? record.code : undefined,
      message:
        typeof record.message === "string" ? record.message : JSON.stringify(record),
      details: typeof record.details === "string" ? record.details : undefined,
      hint: typeof record.hint === "string" ? record.hint : undefined,
    };
  }
  return {
    source,
    message: String(error),
  };
}

function profileScopedKey(base: string, profileId: string | null): string {
  return `${base}:${profileId ?? "global"}`;
}

export default function Home() {
  const { language } = useLanguage();
  const router = useRouter();
  const diasTotales = useMemo(() => (esAnioBisiesto(new Date().getFullYear()) ? 366 : 365), []);

  const [diaActual, setDiaActual] = useState(1);
  const [modo, setModo] = useState<ModoLectura>("adulto");
  const [plan, setPlan] = useState<PlanBiblico | null>(null);
  const [pregunta, setPregunta] = useState<Pregunta | null>(null);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string | null>(null);
  const [diasCompletados, setDiasCompletados] = useState<number[]>([]);
  const [streakActual, setStreakActual] = useState(0);
  const [insignias, setInsignias] = useState<BadgeKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [syncNonce, setSyncNonce] = useState(0);
  const [onboardingVerificado, setOnboardingVerificado] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailConfirmado, setEmailConfirmado] = useState(true);
  const [authModalAbierto, setAuthModalAbierto] = useState(false);
  const [debugInfo, setDebugInfo] = useState<SupabaseDebugInfo | null>(null);
  const [userXp, setUserXp] = useState(0);
  const [avatarKey, setAvatarKey] = useState<string>("lion_shield");
  const [showSplash, setShowSplash] = useState(true);
  const [familyProfiles, setFamilyProfiles] = useState<FamilyProfile[]>(() => createDefaultFamilyProfiles());
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [themePreference, setThemePreference] = useState<ThemePreference>("auto");
  const [unlockedStickers, setUnlockedStickers] = useState<string[]>([]);
  const [syncVisualState, setSyncVisualState] = useState<"synced" | "pending" | "error">("synced");
  const [gameWinDays, setGameWinDays] = useState<number[]>([]);

  const theme = THEMES[modo];
  const selectedProfile = familyProfiles.find((profile) => profile.id === selectedProfileId) ?? null;
  const nombreUsuario =
    selectedProfile?.name ?? userEmail?.split("@")[0] ?? (language === "en" ? "Reader" : "Lector");
  const avatar = getAvatarByKey(avatarKey);
  const levelInfo = getLevelFromXp(userXp);
  const isNightTime = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 6;
  }, []);
  const effectiveTheme = themePreference === "auto" ? (isNightTime ? "dark" : "light") : themePreference;
  const isDarkUi = effectiveTheme === "dark";
  const pageBgClass =
    isDarkUi
      ? "bg-gradient-to-b from-zinc-950 via-zinc-900 to-stone-950 text-stone-100"
      : theme.pageBg;
  const progresoCompletado = (diasCompletados.length / diasTotales) * 100;
  const esCorrecta =
    opcionSeleccionada && pregunta
      ? opcionSeleccionada === pregunta.respuesta_correcta
      : null;

  const reflexionActual =
    modo === "nino" ? plan?.reflexion_nino ?? "" : plan?.reflexion_adulto ?? "";
  const t = language === "en"
    ? {
        goodDay: "Good day",
        dayProgress: "Day",
        yearDone: "of the yearly plan completed",
        streak: "Streak",
        bibleText: "Daily Bible Text",
        continueReading: "Continue where you left off",
        trainGames: "Train / Mini Games",
        quickQuiz: "Quick Quiz",
        completeDay: "Complete Day",
        syncedAs: "Synced as",
        signInCloud: "Sign in to save progress in Supabase",
        resetPlan: "Reset Plan",
        viewRanking: "View Ranking",
        prayerWall: "Go to Prayer Wall",
        hallOfFame: "View Hall of Fame",
        duel: "Enter 1v1 Duel",
      }
    : {
        goodDay: "¡Buen día",
        dayProgress: "Día",
        yearDone: "del año completado",
        streak: "Racha",
        bibleText: "Texto bíblico del día",
        continueReading: "Continuar donde lo dejaste",
        trainGames: "Entrenar / Minijuegos",
        quickQuiz: "Quiz rápido",
        completeDay: "Completar Día",
        syncedAs: "Sincronizado como",
        signInCloud: "Inicia sesión para guardar progreso en Supabase",
        resetPlan: "Reiniciar Plan",
        viewRanking: "Ver Ranking",
        prayerWall: "Ir al Muro de Oración",
        hallOfFame: "Ver Hall of Fame",
        duel: "Entrar a Duelo 1 vs 1",
      };
  const temporadaActual = getSeasonByDay(diaActual, diasTotales);
  const rutaBiblia = plan ? formatBibleRoute(plan.pasaje) : null;
  const stickers: Sticker[] = [
    { id: "first_step", name: "Primer paso", emoji: "🌱", unlocked: diasCompletados.length >= 1 },
    { id: "week_streak", name: "Semana fiel", emoji: "🔥", unlocked: streakActual >= 7 },
    { id: "season_runner", name: "Corredor de temporada", emoji: "🏁", unlocked: diasCompletados.length >= 30 },
    { id: "xp_guardian", name: "Guardián XP", emoji: "🛡️", unlocked: userXp >= 300 },
    { id: "word_master", name: "Maestro de Palabra", emoji: "📖", unlocked: userXp >= 600 },
    { id: "family_light", name: "Luz de familia", emoji: "✨", unlocked: insignias.length >= 1 },
  ];
  const readCompletedToday = diasCompletados.includes(diaActual);
  const gameCompletedToday = gameWinDays.includes(diaActual);
  const spiritualMeter = (readCompletedToday ? 50 : 0) + (gameCompletedToday ? 50 : 0);

  const buildProfilePayload = (updatedAt: string): ProfileStatsPayload | null => {
    if (!userId || !selectedProfileId) return null;
    return {
      user_id: userId,
      profile_id: selectedProfileId,
      xp_total: userXp,
      streak_value: streakActual,
      completed_days: diasCompletados,
      badges: insignias,
      stickers: unlockedStickers,
      mode: modo,
      updated_at: updatedAt,
    };
  };

  const persistProfileUpdatedAt = (updatedAt: string) => {
    if (!selectedProfileId) return;
    localStorage.setItem(profileScopedKey(PROFILE_UPDATED_AT_KEY, selectedProfileId), updatedAt);
  };

  const syncProfileStatsCloud = async (payload: ProfileStatsPayload) => {
    if (!selectedProfileId) return;
    persistProfileUpdatedAt(payload.updated_at);

    if (!userId || !emailConfirmado) {
      setSyncVisualState("pending");
      return;
    }
    if (!navigator.onLine) {
      pushProfileQueue({
        id: crypto.randomUUID(),
        userId,
        profileId: selectedProfileId,
        payload,
      });
      setSyncVisualState("pending");
      return;
    }

    const { error } = await supabase.from("profile_stats").upsert(payload, {
      onConflict: "user_id,profile_id",
    });
    if (error) {
      pushProfileQueue({
        id: crypto.randomUUID(),
        userId,
        profileId: selectedProfileId,
        payload,
      });
      setSyncVisualState("error");
      setSyncError(mapSyncError(error));
      return;
    }
    clearProfileQueue(userId, selectedProfileId);
    setSyncVisualState("synced");
  };

  useEffect(() => {
    const haVistoOnboarding = localStorage.getItem(ONBOARDING_KEY) === "true";
    if (!haVistoOnboarding) {
      router.replace("/onboarding");
      return;
    }
    const storedProfiles = localStorage.getItem(FAMILY_PROFILES_KEY);
    if (storedProfiles) {
      try {
        const parsed = JSON.parse(storedProfiles) as FamilyProfile[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFamilyProfiles(parsed);
        }
      } catch {
        localStorage.removeItem(FAMILY_PROFILES_KEY);
      }
    } else {
      const defaults = createDefaultFamilyProfiles();
      setFamilyProfiles(defaults);
      localStorage.setItem(FAMILY_PROFILES_KEY, JSON.stringify(defaults));
    }

    const selected = localStorage.getItem(FAMILY_SELECTED_PROFILE_KEY);
    if (selected) {
      setSelectedProfileId(selected);
      setShowProfilePicker(false);
    } else {
      setShowProfilePicker(true);
    }

    const pref = localStorage.getItem(THEME_PREF_KEY);
    if (pref === "auto" || pref === "light" || pref === "dark") {
      setThemePreference(pref);
    }

    setOnboardingVerificado(true);
  }, [diasTotales, router]);

  useEffect(() => {
    if (!onboardingVerificado || !selectedProfileId) return;
    localStorage.setItem(profileScopedKey(DEFAULT_MODE_KEY, selectedProfileId), modo);
  }, [modo, onboardingVerificado, selectedProfileId]);

  useEffect(() => {
    if (!onboardingVerificado || !selectedProfileId) return;

    const modeKey = profileScopedKey(DEFAULT_MODE_KEY, selectedProfileId);
    const daysKey = profileScopedKey(STORAGE_KEY, selectedProfileId);
    const streakKey = profileScopedKey(LOCAL_STREAK_KEY, selectedProfileId);
    const lastActivityKey = profileScopedKey(LOCAL_LAST_ACTIVITY_AT_KEY, selectedProfileId);
    const badgesKey = profileScopedKey(BADGES_KEY, selectedProfileId);
    const xpKey = profileScopedKey(XP_KEY, selectedProfileId);
    const stickersKey = profileScopedKey(STICKERS_KEY, selectedProfileId);
    const gameWinsKey = profileScopedKey(GAME_WIN_DAYS_KEY, selectedProfileId);

    const modeStored = localStorage.getItem(modeKey);
    let selectedRole: FamilyProfile["role"] | null = null;
    try {
      const rawProfiles = localStorage.getItem(FAMILY_PROFILES_KEY);
      if (rawProfiles) {
        const parsed = JSON.parse(rawProfiles) as FamilyProfile[];
        if (Array.isArray(parsed)) {
          selectedRole = parsed.find((p) => p.id === selectedProfileId)?.role ?? null;
        }
      }
    } catch {
      selectedRole = null;
    }

    if (modeStored === "adulto" || modeStored === "joven" || modeStored === "nino") {
      setModo(modeStored);
    } else if (selectedRole === "child") {
      setModo("nino");
    }

    const completedStored = localStorage.getItem(daysKey);
    if (completedStored) {
      try {
        const parsed = JSON.parse(completedStored) as number[];
        const normalized = normalizarDias(parsed, diasTotales);
        setDiasCompletados(normalized);
        setDiaActual(getSuggestedDay(normalized, diasTotales));
      } catch {
        localStorage.removeItem(daysKey);
        setDiasCompletados([]);
        setDiaActual(1);
      }
    } else {
      setDiasCompletados([]);
      setDiaActual(1);
    }

    const localStreak = Number(localStorage.getItem(streakKey) ?? 0);
    const localLastActivity = localStorage.getItem(lastActivityKey);
    if (localLastActivity) {
      const diffHours = (Date.now() - new Date(localLastActivity).getTime()) / (1000 * 60 * 60);
      setStreakActual(diffHours > 48 ? 0 : localStreak);
    } else {
      setStreakActual(localStreak);
    }

    const badgesStored = localStorage.getItem(badgesKey);
    if (badgesStored) {
      try {
        setInsignias(JSON.parse(badgesStored) as BadgeKey[]);
      } catch {
        setInsignias([]);
      }
    } else {
      setInsignias([]);
    }

    const xpStored = Number(localStorage.getItem(xpKey) ?? 0);
    setUserXp(Number.isFinite(xpStored) ? xpStored : 0);

    const stickersStored = localStorage.getItem(stickersKey);
    if (stickersStored) {
      try {
        setUnlockedStickers(JSON.parse(stickersStored) as string[]);
      } catch {
        setUnlockedStickers([]);
      }
    } else {
      setUnlockedStickers([]);
    }

    const gameWinsStored = localStorage.getItem(gameWinsKey);
    if (gameWinsStored) {
      try {
        const parsed = JSON.parse(gameWinsStored) as number[];
        setGameWinDays(normalizarDias(parsed, diasTotales));
      } catch {
        setGameWinDays([]);
      }
    } else {
      setGameWinDays([]);
    }
  }, [onboardingVerificado, selectedProfileId, diasTotales]);

  useEffect(() => {
    if (!onboardingVerificado || !selectedProfileId || !userId) return;

    const syncInitialFromCloud = async () => {
      setSyncVisualState("pending");
      const { data, error } = await supabase
        .from("profile_stats")
        .select("xp_total, streak_value, completed_days, badges, stickers, mode, updated_at")
        .eq("user_id", userId)
        .eq("profile_id", selectedProfileId)
        .maybeSingle();

      if (error) {
        setSyncVisualState("error");
        return;
      }
      if (!data) {
        setSyncVisualState("pending");
        return;
      }

      const typedData = data as {
        xp_total: number;
        streak_value: number;
        completed_days: number[];
        badges: string[];
        stickers: string[];
        mode: ModoLectura;
        updated_at: string;
      };

      const updatedAtKey = profileScopedKey(PROFILE_UPDATED_AT_KEY, selectedProfileId);
      const localUpdatedAt = localStorage.getItem(updatedAtKey);
      const cloudUpdatedAt = new Date(typedData.updated_at).getTime();
      const localTs = localUpdatedAt ? new Date(localUpdatedAt).getTime() : 0;

      if (!localUpdatedAt || cloudUpdatedAt > localTs) {
        const daysKey = profileScopedKey(STORAGE_KEY, selectedProfileId);
        const streakKey = profileScopedKey(LOCAL_STREAK_KEY, selectedProfileId);
        const badgesKey = profileScopedKey(BADGES_KEY, selectedProfileId);
        const xpKey = profileScopedKey(XP_KEY, selectedProfileId);
        const stickersKey = profileScopedKey(STICKERS_KEY, selectedProfileId);
        const modeKey = profileScopedKey(DEFAULT_MODE_KEY, selectedProfileId);

        const normalizedDays = normalizarDias(typedData.completed_days ?? [], diasTotales);
        setDiasCompletados(normalizedDays);
        setDiaActual(getSuggestedDay(normalizedDays, diasTotales));
        setStreakActual(typedData.streak_value ?? 0);
        setInsignias((typedData.badges ?? []) as BadgeKey[]);
        setUserXp(typedData.xp_total ?? 0);
        setUnlockedStickers(typedData.stickers ?? []);
        setModo(typedData.mode ?? "adulto");

        localStorage.setItem(daysKey, JSON.stringify(normalizedDays));
        localStorage.setItem(streakKey, String(typedData.streak_value ?? 0));
        localStorage.setItem(badgesKey, JSON.stringify(typedData.badges ?? []));
        localStorage.setItem(xpKey, String(typedData.xp_total ?? 0));
        localStorage.setItem(stickersKey, JSON.stringify(typedData.stickers ?? []));
        localStorage.setItem(modeKey, typedData.mode ?? "adulto");
        localStorage.setItem(updatedAtKey, typedData.updated_at);
      }
      setSyncVisualState("synced");
    };

    void syncInitialFromCloud();
  }, [onboardingVerificado, selectedProfileId, userId, diasTotales]);

  useEffect(() => {
    if (!onboardingVerificado) return;
    const timer = window.setTimeout(() => setShowSplash(false), 2500);
    return () => window.clearTimeout(timer);
  }, [onboardingVerificado]);

  useEffect(() => {
    if (!onboardingVerificado) return;

    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? null);
      setEmailConfirmado(Boolean(session?.user?.email_confirmed_at));
    };

    void initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? null);
      setEmailConfirmado(Boolean(session?.user?.email_confirmed_at));
    });

    return () => subscription.unsubscribe();
  }, [onboardingVerificado]);

  useEffect(() => {
    if (!onboardingVerificado || !userId) return;
    let cancelled = false;

    const syncFamily = async () => {
      const cloud = await fetchFamilyForUser(supabase, userId);
      if (cancelled) return;
      if (cloud && cloud.members.length > 0) {
        setFamilyProfiles(cloud.members);
        localStorage.setItem(FAMILY_PROFILES_KEY, JSON.stringify(cloud.members));
        localStorage.setItem(FAMILY_NAME_KEY, cloud.familyName);
        const sel = localStorage.getItem(FAMILY_SELECTED_PROFILE_KEY);
        if (!sel || !cloud.members.some((m) => m.id === sel)) {
          const first = cloud.members[0];
          if (first) {
            setSelectedProfileId(first.id);
            localStorage.setItem(FAMILY_SELECTED_PROFILE_KEY, first.id);
            setShowProfilePicker(false);
          }
        }
        return;
      }

      const raw = localStorage.getItem(FAMILY_PROFILES_KEY);
      const famName = localStorage.getItem(FAMILY_NAME_KEY) ?? "Mi familia";
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as FamilyProfile[];
        if (!Array.isArray(parsed) || parsed.length === 0) return;
        const res = await upsertFamilyForUser(supabase, userId, famName, parsed);
        if (!cancelled && res.ok) {
          void fetchFamilyForUser(supabase, userId).then((again) => {
            if (!cancelled && again?.members.length) {
              setFamilyProfiles(again.members);
              localStorage.setItem(FAMILY_PROFILES_KEY, JSON.stringify(again.members));
              localStorage.setItem(FAMILY_NAME_KEY, again.familyName);
            }
          });
        }
      } catch {
        /* ignore */
      }
    };

    void syncFamily();
    return () => {
      cancelled = true;
    };
  }, [onboardingVerificado, userId]);

  useEffect(() => {
    if (!onboardingVerificado) return;

    const cargarContenido = async () => {
      setLoading(true);
      setError(null);
      setOfflineNotice(null);
      setOpcionSeleccionada(null);
      setCompletionMessage(null);

      try {
        const [planResult, preguntaResult] = await Promise.all([
          supabase
            .from("plan_biblico")
            .select("id_dia, titulo, pasaje, reflexion_adulto, reflexion_nino")
            .eq("id_dia", diaActual)
            .maybeSingle<PlanBiblico>(),
          supabase
            .from("preguntas")
            .select("id, id_dia, pregunta, opciones, respuesta_correcta, explicacion")
            .eq("id_dia", diaActual)
            .limit(1)
            .maybeSingle<Pregunta>(),
        ]);

        if (planResult.error) throw planResult.error;
        if (preguntaResult.error) throw preguntaResult.error;

        if (planResult.data) {
          const cachePayload: CachedReading<PlanBiblico, Pregunta> = {
            day: diaActual,
            cachedAt: Date.now(),
            plan: planResult.data,
            question: preguntaResult.data ?? null,
          };
          await cacheReading(cachePayload);
          await pruneCachedReadings(7);
          void logAppEvent("start_reading", {
            userId,
            metadata: { day: diaActual, source: "online" },
          });
        }

        setPlan(planResult.data ?? null);
        setPregunta(preguntaResult.data ?? null);
      } catch {
        const cached = await getCachedReading<PlanBiblico, Pregunta>(diaActual);
        if (cached) {
          setPlan(cached.plan);
          setPregunta(cached.question);
          setOfflineNotice("Sin internet: mostrando lectura guardada en caché.");
          void logAppEvent("start_reading", {
            userId,
            metadata: { day: diaActual, source: "offline-cache" },
          });
        } else {
          setError("No hay conexión y este día no está disponible en caché.");
        }
      } finally {
        setLoading(false);
      }
    };

    void cargarContenido();
  }, [diaActual, onboardingVerificado, userId]);

  useEffect(() => {
    if (!onboardingVerificado) return;
    setDiaActual(getSuggestedDay(diasCompletados, diasTotales));
  }, [diasCompletados, diasTotales, onboardingVerificado]);

  useEffect(() => {
    if (!userId) return;
    if (selectedProfileId) return;

    const syncCloud = async () => {
      try {
        const localStored = localStorage.getItem(STORAGE_KEY);
        const localParsed = localStored ? (JSON.parse(localStored) as number[]) : [];
        const localDays = normalizarDias(localParsed, diasTotales);
        const [progressResult, badgesResult, scoreResult, profileResult] = await Promise.all([
          supabase
            .from("user_progress")
            .select("completed_days")
            .eq("user_id", userId)
            .maybeSingle<{ completed_days: number[] | null }>(),
          supabase
            .from("user_badges")
            .select("badge_key")
            .eq("user_id", userId)
            .returns<Array<{ badge_key: BadgeKey }>>(),
          supabase
            .from("user_scores")
            .select("xp_total")
            .eq("user_id", userId)
            .maybeSingle<{ xp_total: number | null }>(),
          supabase
            .from("user_profiles")
            .select("avatar_key")
            .eq("user_id", userId)
            .maybeSingle<{ avatar_key: string | null }>(),
        ]);

        if (progressResult.error) throw progressResult.error;
        if (badgesResult.error) throw badgesResult.error;
        if (scoreResult.error) throw scoreResult.error;
        if (profileResult.error) throw profileResult.error;

        const cloudDays = normalizarDias(
          Array.isArray(progressResult.data?.completed_days) ? progressResult.data.completed_days : [],
          diasTotales,
        );
        const mergedDays = normalizarDias([...localDays, ...cloudDays], diasTotales);
        setDiasCompletados(mergedDays);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedDays));
        setDiaActual(getSuggestedDay(mergedDays, diasTotales));

        const { data: activityData, error: activityError } = await supabase
          .from("daily_activity")
          .select("updated_at, streak_value")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle<{ updated_at: string; streak_value: number }>();

        if (activityError) {
          console.error("SYNC_ERROR_DAILY_ACTIVITY_READ", activityError);
          setDebugInfo(toDebugInfo(activityError, "syncCloud.daily_activity.select"));
        } else if (activityData) {
          const hours = (Date.now() - new Date(activityData.updated_at).getTime()) / (1000 * 60 * 60);
          setStreakActual(hours > 48 ? 0 : activityData.streak_value);
        }

        setInsignias((badgesResult.data ?? []).map((item) => item.badge_key));
        setUserXp(scoreResult.data?.xp_total ?? 0);
        if (profileResult.data?.avatar_key) {
          setAvatarKey(profileResult.data.avatar_key);
        }
        setSyncError(null);
      } catch (error) {
        setDebugInfo(toDebugInfo(error, "syncCloud"));
        setSyncError(mapSyncError(error));
      }
    };

    void syncCloud();
  }, [diasTotales, syncNonce, userId, selectedProfileId]);

  const lanzarConfeti = async () => {
    const confetti = (await import("canvas-confetti")).default;
    void confetti({
      particleCount: 55,
      spread: 58,
      origin: { y: 0.68 },
      colors: ["#065f46", "#10b981", "#d1fae5"],
    });
  };

  const handleSeleccionOpcion = (opcion: string) => {
    setOpcionSeleccionada(opcion);
    if (pregunta && opcion === pregunta.respuesta_correcta) {
      setCompletionMessage("Excelente. Ya puedes completar tu día.");
      void logAppEvent("quiz_correct", {
        userId,
        metadata: { day: diaActual, questionId: pregunta.id },
      });
    }
  };

  useEffect(() => {
    if (!userId) return;
    if (selectedProfileId) return;

    const flush = async () => {
      const pending = getQueueByUser(userId);
      if (pending.length === 0) return;

      for (const item of pending) {
        try {
          const { error: activityError } = await supabase.from("daily_activity").upsert(
            buildDailyActivityPayload({
              userId,
              day: item.day,
              mode: item.mode,
              updatedAt: item.completedAt,
              streakValue: item.streakValue,
            }),
            { onConflict: "user_id,id_dia" },
          );
          if (activityError) throw activityError;

          const { error: progressError } = await supabase.from("user_progress").upsert(
            {
              user_id: userId,
              completed_days: item.completedDays,
              updated_at: item.completedAt,
            },
            { onConflict: "user_id" },
          );
          if (progressError) throw progressError;

          const badges = unlockedBadges(item.streakValue, item.completedDays.length);
          if (badges.length > 0) {
            const rows = badges.map((badge) => ({
              user_id: userId,
              badge_key: badge,
              metadata: { streak: item.streakValue, completedCount: item.completedDays.length },
            }));
            const { error: badgeError } = await supabase.from("user_badges").upsert(rows, {
              onConflict: "user_id,badge_key",
            });
            if (badgeError) throw badgeError;
          }
          removeSyncItem(item.id);
        } catch (error) {
          setDebugInfo(toDebugInfo(error, "syncQueue.flush"));
          setSyncError(
            `Hay actividades pendientes por sincronizar. ${mapSyncError(error)}`,
          );
          break;
        }
      }
    };

    const syncNow = () => {
      if (navigator.onLine) {
        void flush();
      }
    };

    syncNow();
    window.addEventListener("online", syncNow);
    return () => window.removeEventListener("online", syncNow);
  }, [userId, selectedProfileId]);

  useEffect(() => {
    if (!userId || !selectedProfileId) return;

    const flush = async () => {
      const pending = getProfileQueue(userId, selectedProfileId);
      if (pending.length === 0) {
        setSyncVisualState("synced");
        return;
      }

      for (const item of pending) {
        const { error } = await supabase.from("profile_stats").upsert(item.payload, {
          onConflict: "user_id,profile_id",
        });
        if (error) {
          setSyncVisualState("error");
          setSyncError(mapSyncError(error));
          return;
        }
        removeProfileQueueItem(item.id);
      }
      setSyncVisualState("synced");
    };

    const flushIfOnline = () => {
      if (navigator.onLine) {
        void flush();
      } else {
        setSyncVisualState("pending");
      }
    };

    flushIfOnline();
    window.addEventListener("online", flushIfOnline);
    return () => window.removeEventListener("online", flushIfOnline);
  }, [userId, selectedProfileId]);

  const completarDia = async () => {
    if (!plan) return;
    if (!selectedProfileId) return;

    const daysKey = profileScopedKey(STORAGE_KEY, selectedProfileId);
    const streakKey = profileScopedKey(LOCAL_STREAK_KEY, selectedProfileId);
    const lastActivityKey = profileScopedKey(LOCAL_LAST_ACTIVITY_AT_KEY, selectedProfileId);
    const badgesKey = profileScopedKey(BADGES_KEY, selectedProfileId);
    const stickersKey = profileScopedKey(STICKERS_KEY, selectedProfileId);

    const now = new Date();
    const completadosActualizados = normalizarDias([...diasCompletados, diaActual], diasTotales);
    setDiasCompletados(completadosActualizados);
    localStorage.setItem(daysKey, JSON.stringify(completadosActualizados));
    await lanzarConfeti();

    const localPrevStreak = Number(localStorage.getItem(streakKey) ?? 0);
    const lastAt = localStorage.getItem(lastActivityKey);
    const nextLocalStreak = computeNextStreak(lastAt, localPrevStreak, now);
    setStreakActual(nextLocalStreak);
    localStorage.setItem(streakKey, String(nextLocalStreak));
    localStorage.setItem(lastActivityKey, now.toISOString());

    const unlocked = unlockedBadges(nextLocalStreak, completadosActualizados.length);
    const mergedBadges = Array.from(new Set([...insignias, ...unlocked]));
    setInsignias(mergedBadges);
    localStorage.setItem(badgesKey, JSON.stringify(mergedBadges));

    const nextStickers = Array.from(
      new Set(
        stickers
          .filter((sticker) => sticker.unlocked)
          .map((sticker) => sticker.id)
          .concat(unlockedStickers),
      ),
    );
    setUnlockedStickers(nextStickers);
    localStorage.setItem(stickersKey, JSON.stringify(nextStickers));

    const localPayload: ProfileStatsPayload = {
      user_id: userId ?? "",
      profile_id: selectedProfileId,
      xp_total: userXp,
      streak_value: nextLocalStreak,
      completed_days: completadosActualizados,
      badges: mergedBadges,
      stickers: nextStickers,
      mode: modo,
      updated_at: now.toISOString(),
    };
    persistProfileUpdatedAt(localPayload.updated_at);

    void logAppEvent("complete_day", {
      userId,
      metadata: { day: diaActual, mode: modo, offline: !navigator.onLine },
    });

    if (!userId) {
      setCompletionMessage("Día completado localmente. Inicia sesión para sincronizar.");
      setSyncVisualState("pending");
      return;
    }

    if (!emailConfirmado) {
      setCompletionMessage("Día completado localmente.");
      setSyncError(
        "Por favor, confirma tu correo para guardar tu racha en la nube.",
      );
      setSyncVisualState("pending");
      return;
    }

    const payload = { ...localPayload, user_id: userId };
    await syncProfileStatsCloud(payload);
    setCompletionMessage(`Día completado en perfil ${selectedProfile?.name ?? selectedProfileId}.`);
  };

  const guardarXpJuego = async (result: {
    xp: number;
    perfect: boolean;
    correctAnswers?: number;
    timeSeconds?: number;
    source?: "trivia" | "verse_order";
  }) => {
    if (result.xp <= 0) {
      setCompletionMessage("Trivia finalizada. Sigue practicando para ganar XP.");
      return;
    }

    if (!selectedProfileId) return;
    const xpKey = profileScopedKey(XP_KEY, selectedProfileId);
    const gameWinsKey = profileScopedKey(GAME_WIN_DAYS_KEY, selectedProfileId);
    const nextXpLocal = userXp + result.xp;
    setUserXp(nextXpLocal);
    localStorage.setItem(xpKey, String(nextXpLocal));
    const nextGameWins = normalizarDias([...gameWinDays, diaActual], diasTotales);
    setGameWinDays(nextGameWins);
    localStorage.setItem(gameWinsKey, JSON.stringify(nextGameWins));
    const updatedAt = new Date().toISOString();
    persistProfileUpdatedAt(updatedAt);

    if (!userId) {
      setCompletionMessage(`Ganaste ${result.xp} XP en trivia (sincroniza al iniciar sesión).`);
      setSyncVisualState("pending");
      return;
    }
    const payload = buildProfilePayload(updatedAt);
    if (payload) {
      payload.xp_total = nextXpLocal;
      await syncProfileStatsCloud(payload);
    }
    setCompletionMessage(
      result.perfect
        ? `¡Sabio de la Palabra! +${result.xp} XP para ${selectedProfile?.name ?? "perfil"}`
        : `+${result.xp} XP guardados en ${selectedProfile?.name ?? "perfil"}.`,
    );
    if (selectedProfileId) return;

    try {
      const { data, error: readError } = await supabase
        .from("user_scores")
        .select("xp_total")
        .eq("user_id", userId)
        .maybeSingle<{ xp_total: number | null }>();

      if (readError) throw readError;

      const xpTotal = (data?.xp_total ?? 0) + result.xp;
      const { error: upsertError } = await supabase.from("user_scores").upsert(
        {
          user_id: userId,
          xp_total: xpTotal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (upsertError) throw upsertError;

      setCompletionMessage(
        result.perfect
          ? `¡Sabio de la Palabra! Ganaste ${result.xp} XP.`
          : `Ganaste ${result.xp} XP en minijuego.`,
      );
      setUserXp(xpTotal);
    } catch (error) {
      setDebugInfo(toDebugInfo(error, "game.user_scores.upsert"));
      setSyncError(mapSyncError(error));
    }
  };

  const compartirEnWhatsApp = async () => {
    if (!plan) return;
    const texto = `Lectura del día (${diaActual}/${diasTotales})\n${plan.pasaje}\n\nBiblia 365`;
    const urlActual = window.location.href;
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(`${texto}\n${urlActual}`)}`;
    window.open(urlWhatsApp, "_blank", "noopener,noreferrer");
  };

  const reiniciarPlan = async () => {
    const confirmacion = window.confirm(
      "¿Seguro que quieres reiniciar el plan? Se borrará tu progreso local y en la nube.",
    );
    if (!confirmacion) return;
    if (!selectedProfileId) return;

    const daysKey = profileScopedKey(STORAGE_KEY, selectedProfileId);
    const streakKey = profileScopedKey(LOCAL_STREAK_KEY, selectedProfileId);
    const lastActivityKey = profileScopedKey(LOCAL_LAST_ACTIVITY_AT_KEY, selectedProfileId);
    const modeKey = profileScopedKey(DEFAULT_MODE_KEY, selectedProfileId);
    const badgesKey = profileScopedKey(BADGES_KEY, selectedProfileId);
    const xpKey = profileScopedKey(XP_KEY, selectedProfileId);
    const stickersKey = profileScopedKey(STICKERS_KEY, selectedProfileId);

    try {
      if (userId && !selectedProfileId) {
        const [progressReset, activityReset, badgesReset] = await Promise.all([
          supabase.from("user_progress").upsert(
            {
              user_id: userId,
              completed_days: [],
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          ),
          supabase.from("daily_activity").delete().eq("user_id", userId),
          supabase.from("user_badges").delete().eq("user_id", userId),
        ]);

        if (progressReset.error) throw progressReset.error;
        if (activityReset.error) throw activityReset.error;
        if (badgesReset.error) throw badgesReset.error;
        clearSyncQueueByUser(userId);
      }

      localStorage.setItem(daysKey, JSON.stringify([]));
      localStorage.setItem(streakKey, "0");
      localStorage.removeItem(lastActivityKey);
      localStorage.removeItem(modeKey);
      localStorage.setItem(badgesKey, JSON.stringify([]));
      localStorage.setItem(xpKey, "0");
      localStorage.setItem(stickersKey, JSON.stringify([]));
      localStorage.setItem(profileScopedKey(GAME_WIN_DAYS_KEY, selectedProfileId), JSON.stringify([]));
      localStorage.removeItem(profileScopedKey(PROFILE_UPDATED_AT_KEY, selectedProfileId));

      if (userId && selectedProfileId) {
        clearProfileQueue(userId, selectedProfileId);
      }

      setDiasCompletados([]);
      setStreakActual(0);
      setInsignias([]);
      setUserXp(0);
      setUnlockedStickers([]);
      setGameWinDays([]);
      setCompletionMessage("Plan reiniciado. Volvemos al Día 1.");
      setSyncError(null);
      setDiaActual(1);
      setOpcionSeleccionada(null);
    } catch {
      setSyncError("No se pudo reiniciar el plan en este momento.");
    }
  };

  const clearLocalSessionState = async () => {
    if (selectedProfileId) {
      localStorage.setItem(profileScopedKey(STORAGE_KEY, selectedProfileId), JSON.stringify([]));
      localStorage.setItem(profileScopedKey(LOCAL_STREAK_KEY, selectedProfileId), "0");
      localStorage.removeItem(profileScopedKey(LOCAL_LAST_ACTIVITY_AT_KEY, selectedProfileId));
      localStorage.removeItem(profileScopedKey(DEFAULT_MODE_KEY, selectedProfileId));
      localStorage.setItem(profileScopedKey(BADGES_KEY, selectedProfileId), JSON.stringify([]));
      localStorage.setItem(profileScopedKey(XP_KEY, selectedProfileId), "0");
      localStorage.setItem(profileScopedKey(STICKERS_KEY, selectedProfileId), JSON.stringify([]));
      localStorage.setItem(profileScopedKey(GAME_WIN_DAYS_KEY, selectedProfileId), JSON.stringify([]));
      localStorage.removeItem(profileScopedKey(PROFILE_UPDATED_AT_KEY, selectedProfileId));
      if (userId) {
        clearProfileQueue(userId, selectedProfileId);
      }
    }
    await clearCachedReadings();
  };

  const limpiarCacheYReintentarSync = async () => {
    if (!userId) return;

    await clearLocalSessionState();
    clearSyncQueueByUser(userId);

    setDiasCompletados([]);
    setStreakActual(0);
    setInsignias([]);
    setGameWinDays([]);
    setOfflineNotice(null);
    setSyncError("Limpiando caché local y reintentando sincronización...");
    setSyncNonce((prev) => prev + 1);
  };

  const cerrarSesion = async () => {
    const userIdToClear = userId;
    await supabase.auth.signOut();
    if (userIdToClear) {
      clearSyncQueueByUser(userIdToClear);
    }
    await clearLocalSessionState();
    setDiasCompletados([]);
    setStreakActual(0);
    setInsignias([]);
    setPlan(null);
    setPregunta(null);
    setUserId(null);
    setUserEmail(null);
      setUserXp(0);
      setAvatarKey("lion_shield");
    router.replace("/login");
  };

  const seleccionarPerfil = (profileId: string) => {
    setSelectedProfileId(profileId);
    localStorage.setItem(FAMILY_SELECTED_PROFILE_KEY, profileId);
    setShowProfilePicker(false);
    setSyncVisualState("pending");
  };

  const agregarPerfil = () => {
    if (!selectedProfile || selectedProfile.role !== "admin") return;
    const name = newProfileName.trim();
    if (!name) return;
    const id = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 24);
    if (!id || familyProfiles.some((p) => p.id === id)) return;

    const profile: FamilyProfile = {
      id,
      name,
      emoji: "👶🏻",
      role: "member",
    };
    const next = [...familyProfiles, profile];
    setFamilyProfiles(next);
    localStorage.setItem(FAMILY_PROFILES_KEY, JSON.stringify(next));
    setNewProfileName("");
  };

  if (!onboardingVerificado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-50 to-slate-100 text-slate-700">
        <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Preparando tu lectura...</span>
        </div>
      </div>
    );
  }

  if (showProfilePicker || !selectedProfileId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-800 px-4 py-8 text-white">
        <SplashScreen visible={showSplash} />
        <main className="mx-auto w-full max-w-md space-y-4">
          <section className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <p className="text-center text-2xl font-semibold">¿Quién va a leer hoy?</p>
            <p className="mt-1 text-center text-sm text-zinc-200">
              Selecciona un perfil familiar para cargar su progreso.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {familyProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => seleccionarPerfil(profile.id)}
                  className="rounded-2xl border border-white/20 bg-white/10 px-2 py-4 text-center transition hover:bg-white/20"
                >
                  <p className="text-2xl">{profile.emoji}</p>
                  <p className="mt-1 text-xs font-semibold">{profile.name}</p>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-4 pb-12 pt-6 transition-colors ${pageBgClass} ${isDarkUi ? "dark" : ""}`}>
      <SplashScreen visible={showSplash} />
      <main className="mx-auto flex w-full max-w-md flex-col gap-4">
        {userId && !emailConfirmado && (
          <motion.section
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-amber-900 backdrop-blur"
          >
            <p className="inline-flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="h-4 w-4" />
              Por favor, confirma tu correo para guardar tu racha en la nube.
            </p>
          </motion.section>
        )}
        {process.env.NODE_ENV !== "production" && debugInfo && (
          <motion.section
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-200 bg-red-50/90 px-3 py-2 text-red-900"
          >
            <p className="text-xs font-semibold">Debug Sync ({debugInfo.source})</p>
            <p className="mt-1 text-[11px]">code: {debugInfo.code ?? "N/A"}</p>
            <p className="text-[11px]">message: {debugInfo.message}</p>
            {debugInfo.details && <p className="text-[11px]">details: {debugInfo.details}</p>}
            {debugInfo.hint && <p className="text-[11px]">hint: {debugInfo.hint}</p>}
          </motion.section>
        )}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`rounded-3xl p-5 shadow-2xl ring-1 ring-white/70 backdrop-blur ${theme.card}`}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className={`text-2xl leading-tight ${theme.heading}`}>
                {avatar.emoji} {t.goodDay}, {nombreUsuario}!
              </p>
              <p className={`mt-1 text-xs ${theme.body}`}>
                {t.dayProgress} {diaActual} / {diasTotales} · {Math.round(progresoCompletado)}% {t.yearDone}
              </p>
              <p className={`mt-1 text-xs font-medium ${isDarkUi ? "text-violet-300" : "text-violet-700"}`}>
                {temporadaActual.title}: {temporadaActual.subtitle}
              </p>
              <p className={`mt-1 text-xs font-semibold ${isDarkUi ? "text-emerald-300" : "text-emerald-700"}`}>
                Nivel {levelInfo.level}: {levelInfo.title} · {userXp} XP
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${theme.accentSoft}`}>
                <Flame className="h-3.5 w-3.5" />
                {t.streak}: {streakActual}
              </div>
              <div
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${
                  syncVisualState === "synced"
                    ? "bg-emerald-100 text-emerald-800"
                    : syncVisualState === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                }`}
              >
                {syncVisualState === "synced" ? (
                  <Cloud className="h-3.5 w-3.5" />
                ) : syncVisualState === "pending" ? (
                  <CloudOff className="h-3.5 w-3.5" />
                ) : (
                  <CloudAlert className="h-3.5 w-3.5" />
                )}
                {syncVisualState === "synced"
                  ? "☁️ Sincronizado"
                  : syncVisualState === "pending"
                    ? "☁️ Pendiente"
                    : "☁️ Error sync"}
              </div>
              {userId && (
                <button
                  type="button"
                  onClick={() => void cerrarSesion()}
                  className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-200"
                >
                  <LogOut className="h-3 w-3" />
                  Cerrar sesión
                </button>
              )}
            </div>
          </div>

          <div className="mb-4 h-2.5 w-full rounded-full bg-black/10 shadow-inner">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 transition-all"
              style={{ width: `${Math.min(100, progresoCompletado)}%` }}
            />
          </div>
          <div className={`mb-4 rounded-2xl border p-3 ${isDarkUi ? "border-zinc-700 bg-zinc-900/80" : "border-emerald-200 bg-emerald-50/70"}`}>
            <p className={`inline-flex items-center gap-2 text-xs font-semibold ${isDarkUi ? "text-emerald-200" : "text-emerald-800"}`}>
              <Thermometer className="h-4 w-4" />
              Termómetro Espiritual: {spiritualMeter}%
            </p>
            <div className={`mt-2 h-2.5 w-full rounded-full ${isDarkUi ? "bg-zinc-700" : "bg-emerald-100"}`}>
              <div
                className={`h-2.5 rounded-full transition-all ${spiritualMeter >= 100 ? "bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-300 shadow-[0_0_12px_rgba(16,185,129,0.7)]" : "bg-gradient-to-r from-emerald-500 to-emerald-700"}`}
                style={{ width: `${spiritualMeter}%` }}
              />
            </div>
            {spiritualMeter >= 100 && (
              <p className={`mt-2 text-xs font-semibold ${isDarkUi ? "text-amber-200" : "text-amber-800"}`}>
                ¡Hoy has crecido en sabiduría, {nombreUsuario}!
              </p>
            )}
          </div>
          {offlineNotice && <p className={`mb-3 text-xs ${isDarkUi ? "text-amber-300" : "text-amber-700"}`}>{offlineNotice}</p>}

          <ModeSwitcher
            value={modo}
            onChange={setModo}
            trackClassName={theme.pillTrack}
            thumbClassName={theme.pillThumb}
            activeTextClassName={theme.activeText}
            inactiveTextClassName={theme.inactiveText}
          />
          <div className="mt-3">
            <LanguageSwitcher />
          </div>
          <div className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-2 py-1 ${isDarkUi ? "border-zinc-700 bg-zinc-900" : "border-zinc-300 bg-white"}`}>
            <button
              type="button"
              onClick={() => {
                setThemePreference("auto");
                localStorage.setItem(THEME_PREF_KEY, "auto");
              }}
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                themePreference === "auto" ? "bg-zinc-900 text-white" : "text-zinc-600"
              }`}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => {
                setThemePreference("light");
                localStorage.setItem(THEME_PREF_KEY, "light");
              }}
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                themePreference === "light" ? "bg-zinc-900 text-white" : "text-zinc-600"
              }`}
            >
              Claro
            </button>
            <button
              type="button"
              onClick={() => {
                setThemePreference("dark");
                localStorage.setItem(THEME_PREF_KEY, "dark");
              }}
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                themePreference === "dark" ? "bg-zinc-900 text-white" : "text-zinc-600"
              }`}
            >
              Noche
            </button>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.3 }}
          className={`rounded-3xl p-5 shadow-lg ${theme.card}`}
        >
          <h2 className={`inline-flex items-center gap-2 text-lg ${theme.heading}`}>
            <BookOpenText className={`${modo === "nino" ? "h-6 w-6" : "h-5 w-5"} text-emerald-700`} />
            {t.bibleText}
          </h2>

          {loading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando lectura...
            </div>
          ) : error ? (
            <p className={`mt-3 text-sm ${isDarkUi ? "text-red-300" : "text-red-600"}`}>{error}</p>
          ) : !plan ? (
            <div className={`mt-3 rounded-2xl p-4 text-center ${theme.mutedCard}`}>
              <Sparkles className="mx-auto h-10 w-10 text-emerald-600" />
              <p className={`mt-3 ${theme.heading}`}>Estamos preparando este tesoro para ti.</p>
            </div>
          ) : (
            <>
              <p className={`mt-3 text-xl leading-9 text-slate-900 dark:text-slate-100 ${theme.heading}`}>{plan.pasaje}</p>
              <button
                type="button"
                onClick={() => {
                  const flow = document.getElementById("flow-reflexion");
                  if (flow) flow.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold ${theme.accent}`}
              >
                {t.continueReading}
              </button>
              {rutaBiblia && (
                <button
                  type="button"
                  onClick={() => router.push(rutaBiblia)}
                  className="mt-2 w-full rounded-2xl border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800"
                >
                  Abrir referencia en Lector de Biblia
                </button>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <ReadingAudioPlayer text={`${plan.titulo}. ${plan.pasaje}. ${reflexionActual}`} />
                <button
                  type="button"
                  onClick={() => {
                    const gameZone = document.getElementById("game-zone");
                    if (gameZone) gameZone.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"
                >
                  {t.trainGames}
                </button>
              </div>
            </>
          )}
        </motion.section>

        <motion.section
          id="game-zone"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.32, delay: 0.12 }}
        >
          <MiniGamesHub
            mode={modo}
            kidDisplayName={modo === "nino" ? nombreUsuario : undefined}
            onFinish={guardarXpJuego}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.32, delay: 0.14 }}
        >
          <DailyVerseCard />
        </motion.section>

        {plan && (
          <>
            <motion.section
              id="flow-reflexion"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.32 }}
              className={`rounded-3xl p-5 shadow-lg ${theme.mutedCard}`}
            >
              <h3 className={`text-base ${theme.heading}`}>{theme.reflectionLabel}</h3>
              <p className={`mt-3 whitespace-pre-line text-sm leading-7 ${theme.body}`}>{reflexionActual}</p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.32, delay: 0.04 }}
              className={`rounded-3xl p-5 shadow-lg ${theme.card}`}
            >
              <h3 className={`text-base ${theme.heading}`}>{t.quickQuiz}</h3>
              {!pregunta ? (
                <p className={`mt-2 text-sm ${isDarkUi ? "text-slate-300" : "text-slate-600"}`}>Aún no hay trivia para este día.</p>
              ) : (
                <>
                  <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{pregunta.pregunta}</p>
                  <div className="mt-3 space-y-2">
                    {Object.entries(pregunta.opciones)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([clave, texto]) => {
                        const activa = opcionSeleccionada === clave;
                        return (
                          <button
                            key={clave}
                            type="button"
                            onClick={() => handleSeleccionOpcion(clave)}
                            className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                              activa
                                ? isDarkUi
                                  ? "border-emerald-400 bg-emerald-900/20 text-slate-100"
                                  : "border-emerald-500 bg-emerald-50"
                                : isDarkUi
                                  ? "border-slate-700 bg-zinc-900 text-slate-100"
                                  : "border-slate-200 bg-white"
                            }`}
                          >
                            <span className="mr-2 font-semibold">{clave}.</span>
                            {texto}
                          </button>
                        );
                      })}
                  </div>
                  {opcionSeleccionada && esCorrecta !== null && (
                    <div className="mt-3 rounded-xl bg-black/5 p-3">
                      <p className={`inline-flex items-center gap-1 text-sm font-semibold ${esCorrecta ? "text-emerald-700" : "text-red-700"}`}>
                        {esCorrecta ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {esCorrecta ? "¡Muy bien!" : "Casi, sigue intentando"}
                      </p>
                      <p className={`mt-1 text-sm ${isDarkUi ? "text-slate-200" : "text-slate-700"}`}>{pregunta.explicacion}</p>
                    </div>
                  )}
                </>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.32, delay: 0.06 }}
              className={`rounded-3xl p-5 shadow-lg ${theme.mutedCard}`}
            >
              <h3 className={`text-base ${theme.heading}`}>{theme.practicalLabel}</h3>
              <p className={`mt-3 text-sm leading-7 ${theme.body}`}>{theme.practicalText}</p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.32, delay: 0.08 }}
              className={`rounded-3xl p-5 shadow-lg ${theme.card}`}
            >
              <h3 className={`text-base ${theme.heading}`}>{theme.prayerLabel}</h3>
              <p className={`mt-3 text-sm leading-7 ${theme.body}`}>{theme.prayerText}</p>
              <button
                type="button"
                onClick={() => void compartirEnWhatsApp()}
                className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${theme.accentSoft}`}
              >
                <Share2 className="h-4 w-4" />
                Compartir versículo
              </button>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.32, delay: 0.1 }}
              className={`rounded-3xl p-5 shadow-xl ${theme.card}`}
            >
              <button
                type="button"
                onClick={() => void completarDia()}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold ${theme.accent}`}
              >
                {t.completeDay}
              </button>
              {completionMessage && <p className={`mt-3 text-sm ${isDarkUi ? "text-emerald-300" : "text-emerald-700"}`}>{completionMessage}</p>}
              {insignias.length > 0 && (
                <p className={`mt-2 text-xs ${isDarkUi ? "text-slate-300" : "text-slate-600"}`}>Insignias: {insignias.join(", ")}</p>
              )}
              {syncError && (
                <>
                  <p className={`mt-2 text-xs ${isDarkUi ? "text-red-300" : "text-red-600"}`}>{syncError}</p>
                  {userId && (
                    <button
                      type="button"
                      onClick={() => void limpiarCacheYReintentarSync()}
                      className="mt-2 w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      Limpiar caché local y reintentar sincronización
                    </button>
                  )}
                </>
              )}
            </motion.section>

          </>
        )}

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.32 }}
          className={`rounded-3xl p-5 shadow-lg ${theme.card}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              {userEmail ? `${t.syncedAs} ${userEmail}` : t.signInCloud}
            </p>
            {userId ? (
              <button
                type="button"
                onClick={() => void cerrarSesion()}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <LogOut className="h-3.5 w-3.5" />
                Salir
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalAbierto(true)}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold ${theme.accentSoft}`}
              >
                <User className="h-3.5 w-3.5" />
                Iniciar sesión
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => void reiniciarPlan()}
            className="mt-4 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            {t.resetPlan}
          </button>
          <button
            type="button"
            onClick={() => setShowProfilePicker(true)}
            className="mt-2 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"
          >
            {language === "en" ? "Switch Profile" : "Cambiar Perfil"}
          </button>
          {selectedProfile?.role === "admin" && (
            <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
              <p className="text-xs font-semibold text-zinc-700">
                {language === "en" ? "Add Family Profile" : "Añadir Perfil Familiar"}
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  value={newProfileName}
                  onChange={(event) => setNewProfileName(event.target.value)}
                  placeholder={language === "en" ? "New profile name" : "Nombre del nuevo perfil"}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={agregarPerfil}
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  +
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => router.push("/ranking")}
            className="mt-2 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            {t.viewRanking}
          </button>
          <button
            type="button"
            onClick={() => router.push("/oracion")}
            className="mt-2 w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100"
          >
            {t.prayerWall}
          </button>
          <button
            type="button"
            onClick={() => router.push("/hall-of-fame")}
            className="mt-2 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
          >
            {t.hallOfFame}
          </button>
          <button
            type="button"
            onClick={() => router.push("/coleccionables")}
            className={`mt-2 w-full rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              isDarkUi
                ? "border-amber-300/40 bg-amber-900/20 text-amber-200 hover:bg-amber-900/30"
                : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            Abrir Álbum de Coleccionables
          </button>
          <button
            type="button"
            onClick={() => router.push("/biblia")}
            className="mt-2 w-full rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
          >
            Abrir Lector de Biblia
          </button>
          <button
            type="button"
            onClick={() => router.push("/duelo")}
            className="mt-2 w-full rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-800 transition hover:bg-fuchsia-100"
          >
            {t.duel}
          </button>
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-900">Mis Coleccionables</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {insignias.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900"
                >
                  🏅 {badge}
                </span>
              ))}
              {insignias.length === 0 && (
                <span className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-600">
                  Aún sin insignias
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {stickers.map((sticker) => (
                <span
                  key={sticker.id}
                  className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                    sticker.unlocked
                      ? "border-violet-300 bg-violet-100 text-violet-900"
                      : "border-zinc-300 bg-white text-zinc-400"
                  }`}
                >
                  {sticker.emoji} {sticker.name}
                </span>
              ))}
            </div>
          </div>
          <SettingsPanel userId={userId} avatarKey={avatarKey} onAvatarChange={setAvatarKey} />
        </motion.section>
      </main>

      <AuthModal
        open={authModalAbierto}
        onClose={() => setAuthModalAbierto(false)}
        onAuthSuccess={() => setAuthModalAbierto(false)}
      />
    </div>
  );
}
