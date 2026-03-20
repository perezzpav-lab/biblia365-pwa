"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Baby,
  Crown,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  UserCircle2,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  type FamilyProfile,
  type FamilyProfileRole,
  FAMILY_NAME_KEY,
  FAMILY_PROFILES_KEY,
  FAMILY_SELECTED_PROFILE_KEY,
  slugifyProfileId,
} from "@/lib/family-types";
import { upsertFamilyForUser } from "@/lib/family-supabase";
import { supabase } from "@/lib/supabase";

const EMOJI_PRESETS = ["📖", "🙋", "👩", "🧔", "🧒", "👶", "👴", "👵", "💒", "✨", "🕊️", "🌿"];

const ROLE_META: Record<
  FamilyProfileRole,
  { label: string; hint: string; Icon: typeof Crown }
> = {
  admin: { label: "Admin", hint: "Gestiona la cuenta y el progreso", Icon: Crown },
  member: { label: "Miembro", hint: "Lectura personalizada", Icon: UserCircle2 },
  child: { label: "Niño/a", hint: "Modo infantil y minijuegos", Icon: Baby },
};

type Props = {
  userId: string | null;
  onBack: () => void;
  onContinue: () => void;
};

function ensureUniqueIds(members: FamilyProfile[]): FamilyProfile[] {
  const seen = new Set<string>();
  return members.map((m) => {
    let id = m.id;
    while (seen.has(id)) {
      id = `${m.id}_${randomSuffix()}`;
    }
    seen.add(id);
    return { ...m, id };
  });
}

function randomSuffix(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().slice(0, 6);
  }
  return Math.random().toString(36).slice(2, 8);
}

export default function FamilySetup({ userId, onBack, onContinue }: Props) {
  const [familyName, setFamilyName] = useState("");
  const [members, setMembers] = useState<FamilyProfile[]>(() => [
    {
      id: "primary",
      name: "",
      emoji: "📖",
      role: "admin",
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [openEmojiFor, setOpenEmojiFor] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const nameOk = familyName.trim().length >= 2;
    const membersOk = members.every((m) => m.name.trim().length >= 2);
    const hasAdmin = members.some((m) => m.role === "admin");
    return nameOk && membersOk && hasAdmin && members.length >= 1;
  }, [familyName, members]);

  const updateMember = useCallback((id: string, patch: Partial<FamilyProfile>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const addMember = useCallback(() => {
    setMembers((prev) => {
      const next: FamilyProfile = {
        id: slugifyProfileId(`miembro_${prev.length + 1}`),
        name: "",
        emoji: EMOJI_PRESETS[(prev.length + 3) % EMOJI_PRESETS.length],
        role: "member",
      };
      return [...prev, next];
    });
  }, []);

  const removeMember = useCallback((id: string) => {
    setMembers((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((m) => m.id !== id);
      if (!next.some((m) => m.role === "admin") && next[0]) {
        next[0] = { ...next[0], role: "admin" };
      }
      return next;
    });
  }, []);

  const handleContinue = async () => {
    setError(null);
    if (!canSubmit) {
      setError("Completa el nombre de la familia (mín. 2 letras) y cada integrante. Debe haber al menos un administrador.");
      return;
    }

    const normalized = ensureUniqueIds(
      members.map((m, index) => {
        const slug = slugifyProfileId(m.name);
        const stableId =
          index === 0 ? (slug && slug.length > 0 ? slug : "primary") : m.id || slug || `miembro_${randomSuffix()}`;
        return {
          ...m,
          id: stableId,
          name: m.name.trim(),
        };
      }),
    );

    const finalName = familyName.trim();
    setSaving(true);
    try {
      localStorage.setItem(FAMILY_NAME_KEY, finalName);
      localStorage.setItem(FAMILY_PROFILES_KEY, JSON.stringify(normalized));
      const primary = normalized.find((m) => m.role === "admin") ?? normalized[0];
      if (primary) {
        localStorage.setItem(FAMILY_SELECTED_PROFILE_KEY, primary.id);
      }

      if (userId) {
        const res = await upsertFamilyForUser(supabase, userId, finalName, normalized);
        if (!res.ok) {
          setError(`No se pudo guardar en la nube: ${res.message}. Los datos quedaron en este dispositivo.`);
        }
      }

      onContinue();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-gradient-to-br from-slate-900/90 via-emerald-950/80 to-slate-950/95 p-1 shadow-[0_25px_80px_-20px_rgba(16,185,129,0.35)]">
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl"
        aria-hidden
      />

      <div className="relative rounded-[1.4rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-900/40">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/90">
              Paso personalizado
            </p>
            <h2 className="mt-0.5 font-serif text-xl font-semibold text-white">
              Tu familia en Biblia 365
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-300/90">
              Cada perfil guarda su propia racha, XP y coleccionables. Diseñado para hogares reales — no genérico.
            </p>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Nombre de la familia
          </span>
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="Ej. Familia Rivera"
            className="w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none ring-emerald-400/0 transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/30"
            autoComplete="organization"
          />
        </label>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">Integrantes</span>
            <button
              type="button"
              onClick={addMember}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              Añadir
            </button>
          </div>

          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {members.map((m, index) => (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative rounded-2xl border border-white/10 bg-black/20 p-3"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenEmojiFor((id) => (id === m.id ? null : m.id))}
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-2xl transition hover:border-emerald-400/40 hover:bg-white/10"
                        aria-label="Elegir emoji"
                      >
                        {m.emoji}
                      </button>
                      {openEmojiFor === m.id && (
                        <div className="absolute left-0 top-full z-20 mt-1 grid max-h-40 w-48 grid-cols-6 gap-1 rounded-xl border border-white/20 bg-slate-900 p-2 shadow-xl">
                          {EMOJI_PRESETS.map((em) => (
                            <button
                              key={em}
                              type="button"
                              className="rounded-lg p-1 text-lg hover:bg-white/10"
                              onClick={() => {
                                updateMember(m.id, { emoji: em });
                                setOpenEmojiFor(null);
                              }}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => updateMember(m.id, { name: e.target.value })}
                        placeholder={index === 0 ? "Nombre del administrador" : "Nombre en pantalla"}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-400/40"
                      />

                      <div className="flex flex-wrap gap-1.5">
                        {(Object.keys(ROLE_META) as FamilyProfileRole[]).map((role) => {
                          const meta = ROLE_META[role];
                          const Icon = meta.Icon;
                          const active = m.role === role;
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => {
                                setMembers((prev) => {
                                  if (role === "admin") {
                                    return prev.map((x) =>
                                      x.id === m.id
                                        ? { ...x, role: "admin" }
                                        : x.role === "admin"
                                          ? { ...x, role: "member" }
                                          : x,
                                    );
                                  }
                                  const target = prev.find((x) => x.id === m.id);
                                  if (target?.role === "admin") {
                                    const others = prev.filter((x) => x.id !== m.id);
                                    if (others.length === 0) return prev;
                                    return prev.map((x) => {
                                      if (x.id === m.id) return { ...x, role };
                                      if (x.id === others[0].id) return { ...x, role: "admin" };
                                      return x;
                                    });
                                  }
                                  return prev.map((x) => (x.id === m.id ? { ...x, role } : x));
                                });
                              }}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                                active
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-900/30"
                                  : "border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                              }`}
                              title={meta.hint}
                            >
                              <Icon className="h-3 w-3" />
                              {meta.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMember(m.id)}
                        className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                        aria-label="Quitar integrante"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.06] to-transparent px-3 py-2.5">
          <Shield className="h-4 w-4 shrink-0 text-emerald-300" />
          <p className="text-[11px] leading-snug text-slate-400">
            {userId
              ? "Tus datos se guardan en este dispositivo y en tu cuenta (Supabase) con acceso solo tuyo."
              : "Los datos se guardan en este dispositivo. Inicia sesión en la app para sincronizar en la nube."}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="min-h-11 rounded-2xl border border-white/15 text-sm font-semibold text-slate-200 transition hover:bg-white/5 disabled:opacity-50"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={saving}
            className="min-h-11 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
