"use client";

import { CheckCircle2, Copy, Link2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { pickSharedQuiz } from "@/lib/shared-quiz";

function randomSeed(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function clampQuestionCount(n: number): number {
  if (!Number.isFinite(n)) return 7;
  return Math.min(12, Math.max(5, Math.floor(n)));
}

export default function CompartirQuizClient() {
  const router = useRouter();
  const params = useSearchParams();
  const seedFromUrl = params.get("r") ?? "";
  const countParam = Number(params.get("n") ?? "7");
  const qCount = clampQuestionCount(countParam);

  const [copied, setCopied] = useState(false);

  const questions = useMemo(
    () => (seedFromUrl ? pickSharedQuiz(seedFromUrl, qCount) : []),
    [seedFromUrl, qCount],
  );

  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined" || !seedFromUrl) return "";
    const q = qCount !== 7 ? `&n=${qCount}` : "";
    return `${window.location.origin}/compartir?r=${seedFromUrl}${q}`;
  }, [seedFromUrl, qCount]);

  useEffect(() => {
    setStep(0);
    setScore(0);
    setFinished(false);
  }, [seedFromUrl, qCount]);

  const startNew = useCallback(() => {
    const s = randomSeed();
    const q = qCount !== 7 ? `&n=${qCount}` : "";
    router.replace(`/compartir?r=${s}${q}`);
    setStep(0);
    setScore(0);
    setFinished(false);
  }, [router, qCount]);

  const copyLink = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [inviteUrl]);

  const answer = (idx: number) => {
    if (finished || !questions[step]) return;
    const q = questions[step];
    if (idx === q.correct) setScore((s) => s + 1);
    if (step + 1 >= questions.length) {
      setFinished(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  if (!seedFromUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-violet-50 px-4 py-10">
        <main className="mx-auto max-w-md space-y-6">
          <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-xl">
            <h1 className="inline-flex items-center gap-2 text-xl font-bold text-zinc-900">
              <Link2 className="h-6 w-6 text-emerald-600" />
              Quiz compartido — Biblia 365
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Cada invitación usa una semilla distinta: salen preguntas distintas del banco (y el orden de las respuestas
              cambia). Misma URL = mismo reto para comparar con amigos.
            </p>
            <label className="mt-4 block text-xs font-semibold text-zinc-700">
              Preguntas por reto ({qCount})
              <input
                type="range"
                min={5}
                max={12}
                value={qCount}
                onChange={(e) => {
                  const v = clampQuestionCount(Number(e.target.value));
                  router.replace(`/compartir?n=${v}`);
                }}
                className="mt-2 w-full accent-emerald-600"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const s = randomSeed();
                router.replace(`/compartir?r=${s}&n=${qCount}`);
              }}
              className="mt-5 w-full rounded-2xl bg-emerald-700 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-800"
            >
              Crear invitación nueva
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-3 w-full rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-700"
            >
              Volver al inicio
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-emerald-50 px-4 py-8">
      <main className="mx-auto max-w-md space-y-5">
        <div className="rounded-3xl border border-violet-200 bg-white p-5 shadow-xl">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-violet-800">
            <Sparkles className="h-4 w-4" />
            Reto compartido · {questions.length} preguntas
          </p>
          <p className="mt-1 text-xs text-zinc-500">Código: {seedFromUrl.slice(0, 14)}…</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Copy className="h-4 w-4" />
              {copied ? "¡Copiado!" : "Copiar enlace"}
            </button>
            <button
              type="button"
              onClick={startNew}
              className="rounded-xl border border-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-800"
            >
              Otro reto
            </button>
          </div>
        </div>

        {!finished && questions[step] && (
          <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-lg">
            <p className="text-xs font-semibold text-zinc-500">
              Pregunta {step + 1} de {questions.length}
            </p>
            <p className="mt-2 text-base font-semibold text-zinc-900">{questions[step].question}</p>
            <div className="mt-4 space-y-2">
              {questions[step].options.map((opt, i) => (
                <button
                  key={`${step}-${opt}`}
                  type="button"
                  onClick={() => answer(i)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-left text-sm font-medium text-zinc-800 transition hover:border-violet-400 hover:bg-violet-50"
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>
        )}

        {finished && (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-lg">
            <p className="inline-flex items-center gap-2 text-lg font-bold text-emerald-900">
              <CheckCircle2 className="h-6 w-6" />
              ¡Listo!
            </p>
            <p className="mt-2 text-sm text-emerald-800">
              Puntuación: {score} / {questions.length}. Comparte el mismo enlace para que otro jugador juegue el mismo set.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-4 w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white"
            >
              Ir a Biblia 365
            </button>
          </section>
        )}

        <p className="text-center text-xs text-zinc-500">
          Para duelo en vivo con cuenta:{" "}
          <button type="button" className="font-semibold text-violet-700 underline" onClick={() => router.push("/duelo")}>
            Duelo 1 vs 1
          </button>
        </p>
      </main>
    </div>
  );
}
