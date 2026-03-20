"use client";

import { useState } from "react";
import { Loader2, LogIn, Mail, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
};

type AuthMode = "login" | "signup";

export default function AuthModal({ open, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError("Completa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      setMessage(
        "Cuenta creada. Revisa tu correo y confirma tu cuenta para activar sincronización en la nube.",
      );
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onAuthSuccess?.();
    onClose();
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
      return;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-zinc-900">Tu cuenta en Biblia 365</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-full bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`min-h-10 rounded-full text-sm font-medium transition ${
              mode === "login" ? "bg-emerald-700 text-white" : "text-zinc-600"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`min-h-10 rounded-full text-sm font-medium transition ${
              mode === "signup" ? "bg-emerald-700 text-white" : "text-zinc-600"
            }`}
          >
            Crear cuenta
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-sm text-zinc-700">
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
              placeholder="tu@correo.com"
            />
          </label>

          <label className="block text-sm text-zinc-700">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
              placeholder="********"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}

        <button
          type="button"
          onClick={() => void handleEmailAuth()}
          disabled={loading}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          {mode === "login" ? "Entrar con correo" : "Crear cuenta con correo"}
        </button>

        <button
          type="button"
          onClick={() => void handleGoogleAuth()}
          disabled={loading}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <LogIn className="h-4 w-4" />
          Continuar con Google
        </button>
      </div>
    </div>
  );
}
