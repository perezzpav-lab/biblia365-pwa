"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Send, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type StatsResponse = {
  ok: boolean;
  totalEnabledSubscriptions: number;
  byTimezone: Record<string, number>;
  byReminderTime: Record<string, number>;
  remindersReady: boolean;
  cronPath: string;
  cronHeader: string;
};

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [title, setTitle] = useState("Biblia 365");
  const [body, setBody] = useState("Tu lectura diaria te está esperando. Mantén viva tu racha.");
  const [target, setTarget] = useState<"all" | "timezone">("all");
  const [timezone, setTimezone] = useState("America/Mexico_City");

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setToken(session?.access_token ?? null);
    };
    void init();
  }, []);

  const tzOptions = useMemo(() => Object.keys(stats?.byTimezone ?? {}), [stats]);

  const cargarStats = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/push-stats", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const json = (await response.json()) as StatsResponse & { error?: string };
    if (!response.ok) {
      setError(json.error ?? "No autorizado para panel admin.");
      setLoading(false);
      return;
    }

    setStats(json);
    setLoading(false);
  };

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => {
      void cargarStats(token);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [token]);

  const enviarManual = async () => {
    if (!token) {
      setError("Inicia sesión para usar el panel admin.");
      return;
    }

    setSending(true);
    setError(null);
    setStatus(null);

    const response = await fetch("/api/admin/push-send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        body,
        target,
        timezone: target === "timezone" ? timezone : undefined,
      }),
    });

    const json = (await response.json()) as { ok?: boolean; sent?: number; removed?: number; error?: string };
    if (!response.ok) {
      setError(json.error ?? "No se pudo enviar notificación manual.");
      setSending(false);
      return;
    }

    setStatus(`Envío completado. Enviadas: ${json.sent ?? 0} · Depuradas: ${json.removed ?? 0}`);
    setSending(false);
    await cargarStats(token);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 py-8">
        <main className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl">
          <p className="text-sm text-zinc-600">Inicia sesión para acceder al panel de administración.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 py-8">
      <main className="mx-auto max-w-xl space-y-4">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl">
          <h1 className="inline-flex items-center gap-2 font-serif text-2xl font-semibold text-zinc-900">
            <ShieldCheck className="h-6 w-6 text-emerald-700" />
            Admin Push Center
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Envía notificaciones manuales y valida el estado del sistema de recordatorios.
          </p>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl">
          {loading ? (
            <div className="inline-flex items-center gap-2 text-sm text-zinc-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando estado del sistema...
            </div>
          ) : stats ? (
            <div className="space-y-2 text-sm text-zinc-700">
              <p>Suscripciones activas: <span className="font-semibold">{stats.totalEnabledSubscriptions}</span></p>
              <p>Reminders listos: <span className="font-semibold">{stats.remindersReady ? "Sí" : "No"}</span></p>
              <p>Cron endpoint: <code>{stats.cronPath}</code></p>
              <p>Header cron requerido: <code>{stats.cronHeader}</code></p>
            </div>
          ) : null}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl">
          <h2 className="text-base font-semibold text-zinc-900">Enviar push manual</h2>
          <div className="mt-3 space-y-3">
            <label className="block text-sm text-zinc-700">
              Título
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm text-zinc-700">
              Mensaje
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
                rows={3}
              />
            </label>
            <label className="block text-sm text-zinc-700">
              Segmento
              <select
                value={target}
                onChange={(event) => setTarget(event.target.value as "all" | "timezone")}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
              >
                <option value="all">Todos</option>
                <option value="timezone">Por zona horaria</option>
              </select>
            </label>
            {target === "timezone" && (
              <label className="block text-sm text-zinc-700">
                Zona horaria
                <select
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
                >
                  {(tzOptions.length ? tzOptions : [timezone]).map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <button
            type="button"
            onClick={() => void enviarManual()}
            disabled={sending}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar notificación
          </button>
          {status && <p className="mt-3 text-sm text-emerald-700">{status}</p>}
        </section>
      </main>
    </div>
  );
}
