"use client";

import { CheckCircle2, Copy, Link2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type QuizItem = {
  question: string;
  options: string[];
  correct: number;
};

const BANK: QuizItem[] = [
  {
    question: "¿Quién libró a Daniel del foso de los leones?",
    options: ["Dios", "El rey", "Los soldados"],
    correct: 0,
  },
  {
    question: "¿Qué libro viene después de los Evangelios?",
    options: ["Hechos", "Romanos", "Apocalipsis"],
    correct: 0,
  },
  {
    question: "¿Cuántos días creó Dios el cielo y la tierra según Génesis 1?",
    options: ["6 días", "7 días", "40 días"],
    correct: 0,
  },
  {
    question: "¿Quién fue arrojado al foso de los leones?",
    options: ["Daniel", "Jonás", "Pedro"],
    correct: 0,
  },
  {
    question: "¿Qué debemos buscar primero según Mateo 6:33?",
    options: ["El reino de Dios", "Las riquezas", "La fama"],
    correct: 0,
  },
  {
    question: "¿Quién venció a Goliat?",
    options: ["David", "Saúl", "Samuel"],
    correct: 0,
  },
];

function hashSeed(str: string): number {
  let h = 1779033703;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickQuiz(seedStr: string, count: number): QuizItem[] {
  const rand = mulberry32(hashSeed(seedStr));
  const pool = [...BANK];
  const out: QuizItem[] = [];
  while (out.length < count && pool.length > 0) {
    const idx = Math.floor(rand() * pool.length);
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}

function randomSeed(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function CompartirQuizClient() {
  const router = useRouter();
  const params = useSearchParams();
  const seedFromUrl = params.get("r") ?? "";
  const [copied, setCopied] = useState(false);

  const questions = useMemo(() => (seedFromUrl ? pickQuiz(seedFromUrl, 3) : []), [seedFromUrl]);

  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined" || !seedFromUrl) return "";
    return `${window.location.origin}/compartir?r=${seedFromUrl}`;
  }, [seedFromUrl]);

  useEffect(() => {
    setStep(0);
    setScore(0);
    setFinished(false);
  }, [seedFromUrl]);

  const startNew = useCallback(() => {
    const s = randomSeed();
    router.replace(`/compartir?r=${s}`);
    setStep(0);
    setScore(0);
    setFinished(false);
  }, [router]);

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
              Versículo compartido — Quiz rápido
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Crea un reto con enlace único. Quien abra el mismo enlace verá las mismas 3 preguntas: ideal para
              competir con amigos o familia.
            </p>
            <button
              type="button"
              onClick={startNew}
              className="mt-5 w-full rounded-2xl bg-emerald-700 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-800"
            >
              Crear invitación
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
            Reto compartido
          </p>
          <p className="mt-1 text-xs text-zinc-500">Código: {seedFromUrl.slice(0, 12)}…</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Copy className="h-4 w-4" />
              {copied ? "¡Copiado!" : "Copiar enlace de invitación"}
            </button>
            <button
              type="button"
              onClick={startNew}
              className="rounded-xl border border-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-800"
            >
              Nuevo reto
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
                  key={opt}
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
              Puntuación: {score} / {questions.length}. Pídele a tu invitado que abra el mismo enlace y comparen
              resultados.
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
          Sin cuenta: solo comparten el mismo enlace. Para duelo en vivo con cuenta, usa{" "}
          <button type="button" className="font-semibold text-violet-700 underline" onClick={() => router.push("/duelo")}>
            Duelo 1 vs 1
          </button>
          .
        </p>
      </main>
    </div>
  );
}
