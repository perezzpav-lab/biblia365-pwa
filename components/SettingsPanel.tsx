"use client";

import { Bell, BellOff, Clock3 } from "lucide-react";
import { useState } from "react";
import { AVATAR_OPTIONS } from "@/lib/avatars";
import { supabase } from "@/lib/supabase";
import { logAppEvent } from "@/lib/telemetry";

const REMINDER_TIME_KEY = "biblia365_reminder_time";

type SettingsPanelProps = {
  userId: string | null;
  avatarKey?: string | null;
  onAvatarChange?: (next: string) => void;
};

export default function SettingsPanel({ userId, avatarKey, onAvatarChange }: SettingsPanelProps) {
  const [time, setTime] = useState(() => {
    if (typeof window === "undefined") return "07:00";
    return localStorage.getItem(REMINDER_TIME_KEY) ?? "07:00";
  });
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "default";
    return Notification.permission;
  });
  const [status, setStatus] = useState<string | null>(null);
  const [subscriptionEndpoint, setSubscriptionEndpoint] = useState<string | null>(null);

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const registerPushWorker = async () => {
    if (!("serviceWorker" in navigator)) {
      setStatus("Tu navegador no soporta Service Worker.");
      return;
    }

    await navigator.serviceWorker.register("/push-sw.js", { scope: "/push/" });
  };

  const enableNotifications = async () => {
    if (!userId) {
      setStatus("Inicia sesión para activar recordatorios push.");
      return;
    }

    if (!("Notification" in window)) {
      setStatus("Tu navegador no soporta notificaciones.");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result !== "granted") {
      setStatus("No se concedió permiso de notificaciones.");
      return;
    }

    await registerPushWorker();

    const registration = await navigator.serviceWorker.ready;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
      return;
    }

    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      }));

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setStatus("No se encontró sesión activa.");
      return;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscription,
        reminderTime: time,
        timezone,
      }),
    });

    if (!response.ok) {
      setStatus("No se pudo registrar la suscripción push.");
      return;
    }

    setSubscriptionEndpoint(subscription.endpoint);
    localStorage.setItem(REMINDER_TIME_KEY, time);
    setStatus(`Recordatorio diario configurado a las ${time}.`);
    await logAppEvent("set_reminder", {
      userId,
      metadata: { reminderTime: time },
    });
  };

  const disableNotifications = async () => {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (!existing) {
      setStatus("No hay suscripción activa.");
      return;
    }

    const endpoint = existing.endpoint;
    await existing.unsubscribe();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint }),
      });
    }

    setSubscriptionEndpoint(null);
    setStatus("Recordatorios push desactivados.");
  };

  const saveAvatar = async (nextAvatar: string) => {
    if (!userId) {
      setStatus("Inicia sesión para configurar avatar.");
      return;
    }

    const { error } = await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        avatar_key: nextAvatar,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      setStatus("No se pudo guardar el avatar.");
      return;
    }

    onAvatarChange?.(nextAvatar);
    setStatus("Avatar actualizado.");
  };

  return (
    <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs font-semibold text-zinc-700">Ajustes de recordatorio</p>
      <div className="mt-2 flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-zinc-500" />
        <input
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={() => void enableNotifications()}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
      >
        {permission === "granted" ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        Guardar recordatorio diario
      </button>
      <button
        type="button"
        onClick={() => void disableNotifications()}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
      >
        Desactivar recordatorios push
      </button>
      {subscriptionEndpoint && (
        <p className="mt-2 truncate text-[10px] text-zinc-500">Endpoint activo: {subscriptionEndpoint}</p>
      )}
      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-2">
        <p className="mb-2 text-xs font-semibold text-zinc-700">Avatar de perfil</p>
        <div className="grid grid-cols-3 gap-2">
          {AVATAR_OPTIONS.map((avatar) => (
            <button
              key={avatar.key}
              type="button"
              onClick={() => void saveAvatar(avatar.key)}
              className={`rounded-xl border px-2 py-2 text-center text-xs font-medium transition ${
                avatarKey === avatar.key
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              }`}
            >
              <div className="text-lg">{avatar.emoji}</div>
              <div className="mt-1">{avatar.label}</div>
            </button>
          ))}
        </div>
      </div>
      {status && <p className="mt-2 text-xs text-zinc-600">{status}</p>}
    </div>
  );
}
