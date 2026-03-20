"use client";

import { BellRing, HeartHandshake } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PrayerRequest = {
  id: string;
  message: string;
  prayed_count: number;
  created_at: string;
  user_id: string | null;
};

export default function OracionPage() {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isNightMode, setIsNightMode] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("prayer_requests")
      .select("id, message, prayed_count, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setStatus("No se pudo cargar el muro de oración.");
      setLoading(false);
      return;
    }
    setRequests((data ?? []) as PrayerRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      await load();
    };
    void init();
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
    const channel = supabase
      .channel("realtime-prayer-wall")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prayer_requests" },
        () => {
          void load();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prayer_supports" },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const notificationsChannel = supabase
      .channel(`realtime-prayer-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_events",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const eventName =
            typeof payload.new === "object" &&
            payload.new !== null &&
            "event_name" in payload.new
              ? String((payload.new as { event_name?: unknown }).event_name ?? "")
              : "";
          if (eventName === "prayer_interceded") {
            setToast("¡Alguien acaba de interceder por tu petición!");
            window.setTimeout(() => setToast(null), 3500);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(notificationsChannel);
    };
  }, [userId]);

  const publish = async () => {
    if (!message.trim()) return;
    const data = {
      user_id: userId,
      message: message.trim(),
      prayed_count: 0,
    };
    console.log("DATOS_ENVIADOS", data);
    const { error } = await supabase.from("prayer_requests").insert(data);
    if (error) {
      setStatus("No se pudo publicar la petición.");
      return;
    }
    setMessage("");
    setStatus("Petición publicada. La comunidad orará contigo.");
    await load();
  };

  const support = async (request: PrayerRequest) => {
    if (userId) {
      await supabase.from("prayer_supports").upsert(
        { request_id: request.id, user_id: userId },
        { onConflict: "request_id,user_id" },
      );
    }

    console.log("DATOS_PATCH", { id: request.id, currentCount: request.prayed_count });
    const { error } = await supabase
      .from("prayer_requests")
      .update({
        prayed_count: request.prayed_count + 1,
      })
      .eq("id", request.id);

    if (error) {
      setStatus("No se pudo registrar tu apoyo.");
      return;
    }

    if (request.user_id) {
      await supabase.from("app_events").insert({
        user_id: request.user_id,
        event_name: "prayer_interceded",
        metadata: {
          request_id: request.id,
          supported_by: userId,
        },
      });
    }
    await load();
  };

  return (
    <div
      className={`min-h-screen px-4 py-8 ${
        isNightMode
          ? "bg-gradient-to-b from-slate-950 via-slate-900 to-gray-900 text-slate-100 dark"
          : "bg-gradient-to-b from-zinc-50 to-zinc-100 text-slate-900"
      }`}
    >
      <main className="mx-auto w-full max-w-2xl space-y-4">
        {toast && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 shadow">
            <p className="inline-flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              {toast}
            </p>
          </div>
        )}
        <section className={`rounded-3xl border p-6 shadow-xl ${isNightMode ? "border-zinc-700 bg-zinc-900/80" : "border-zinc-200 bg-white"}`}>
          <h1 className="inline-flex items-center gap-2 font-serif text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <HeartHandshake className="h-6 w-6 text-emerald-700" />
            Muro de Oración
          </h1>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            Comparte tu petición y permite que la comunidad ore por ti.
          </p>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className={`mt-4 w-full rounded-xl border px-3 py-2 text-sm ${isNightMode ? "border-zinc-600 bg-zinc-800 text-slate-100" : "border-zinc-300 bg-white text-slate-900"}`}
            rows={3}
            placeholder="Pidan por mi familia..."
          />
          <button
            type="button"
            onClick={() => void publish()}
            className="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Publicar petición
          </button>
          {status && <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{status}</p>}
        </section>

        <section className={`rounded-3xl border p-4 shadow-xl ${isNightMode ? "border-zinc-700 bg-zinc-900/80" : "border-zinc-200 bg-white"}`}>
          {loading ? (
            <p className="text-sm text-slate-700 dark:text-slate-300">Cargando peticiones...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Aún no hay peticiones publicadas.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((item) => (
                <div key={item.id} className={`rounded-xl border p-3 ${isNightMode ? "border-zinc-700 bg-zinc-800/80" : "border-zinc-200 bg-zinc-50"}`}>
                  <p className="text-sm text-slate-900 dark:text-slate-100">{item.message}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-slate-600 dark:text-slate-400">{item.prayed_count} personas orando</p>
                    <button
                      type="button"
                      onClick={() => void support(item)}
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Estoy orando por ti
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
