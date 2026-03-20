"use client";

import { useState } from "react";
import { Loader2, LogIn, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

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
    router.replace("/");
  };

  const signUp = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

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

    setMessage("Revisa tu correo para confirmar tu cuenta.");
    setLoading(false);
  };

  const signInGoogle = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-slate-100 px-4 py-10">
      <main className="mx-auto w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <h1 className="font-serif text-2xl font-semibold text-zinc-900">Bienvenido a Biblia 365</h1>
        <p className="mt-1 text-sm text-zinc-600">Inicia sesión para continuar tu racha espiritual.</p>

        <div className="mt-5 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.com"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}

        <button
          type="button"
          onClick={() => void signIn()}
          disabled={loading}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => void signUp()}
          disabled={loading}
          className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-700"
        >
          Crear cuenta
        </button>
        <button
          type="button"
          onClick={() => void signInGoogle()}
          disabled={loading}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-700"
        >
          <LogIn className="h-4 w-4" />
          Continuar con Google
        </button>
      </main>
    </div>
  );
}
