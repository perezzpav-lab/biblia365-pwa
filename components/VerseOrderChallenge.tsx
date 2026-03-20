"use client";

import { motion } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { ModoLectura } from "@/components/home/ModeSwitcher";

type VerseOrderChallengeProps = {
  mode: ModoLectura;
  onFinish: (result: { xp: number; perfect: boolean; timeSeconds: number }) => Promise<void> | void;
};

type VerseChallenge = {
  id: string;
  reference: string;
  verse: string;
};

const CHALLENGES: Record<ModoLectura, VerseChallenge> = {
  adulto: {
    id: "vo-adulto",
    reference: "Proverbios 3:5",
    verse: "Confía en el Señor con todo tu corazón",
  },
  joven: {
    id: "vo-joven",
    reference: "1 Timoteo 4:12",
    verse: "Sé ejemplo en palabra conducta amor fe y pureza",
  },
  nino: {
    id: "vo-nino",
    reference: "Salmo 119:105",
    verse: "Tu palabra es una lámpara a mis pies",
  },
};

function shuffleWords(words: string[]): string[] {
  const arr = [...words];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function VerseOrderChallenge({ mode, onFinish }: VerseOrderChallengeProps) {
  const challenge = CHALLENGES[mode];
  const correctWords = useMemo(() => challenge.verse.split(" "), [challenge.verse]);
  const [pool, setPool] = useState<string[]>(() => shuffleWords(correctWords));
  const [built, setBuilt] = useState<string[]>([]);
  const [startAt] = useState(() => Date.now());
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickWord = (word: string, index: number) => {
    if (done) return;
    setBuilt((prev) => [...prev, word]);
    setPool((prev) => prev.filter((_, idx) => idx !== index));
  };

  const reset = () => {
    setBuilt([]);
    setPool(shuffleWords(correctWords));
    setDone(false);
  };

  const check = async () => {
    const elapsedSeconds = Math.max(1, Math.floor((Date.now() - startAt) / 1000));
    const perfect = built.join(" ") === correctWords.join(" ");
    let xp = 0;
    if (perfect) {
      xp += 15;
      if (elapsedSeconds <= 20) {
        xp += 10;
      }
    }
    setDone(true);
    setSaving(true);
    await onFinish({ xp, perfect, timeSeconds: elapsedSeconds });
    setSaving(false);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border p-4 shadow-lg ${
        mode === "nino" ? "border-sky-200 bg-sky-50" : "border-zinc-200 bg-white"
      }`}
    >
      <header className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-900">Juego 2: Verso en Orden</p>
        <p className="text-xs text-zinc-600">{challenge.reference}</p>
      </header>

      <p className="mb-2 text-xs text-zinc-600">
        Toca las palabras en el orden correcto para reconstruir el versículo.
      </p>

      <div className="min-h-14 rounded-xl border border-dashed border-zinc-300 bg-white p-2">
        {built.length === 0 ? (
          <p className="text-xs text-zinc-400">Aquí se irá armando el versículo...</p>
        ) : (
          <p className="text-sm text-zinc-800">{built.join(" ")}</p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {pool.map((word, idx) => (
          <button
            key={`${word}-${idx}`}
            type="button"
            onClick={() => pickWord(word, idx)}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-800 transition hover:border-emerald-400"
          >
            {mode === "nino" ? `⭐ ${word}` : word}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
        >
          <RotateCcw className="h-4 w-4" />
          Reiniciar
        </button>
        <button
          type="button"
          onClick={() => void check()}
          disabled={built.length !== correctWords.length || saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {saving ? "Guardando..." : "Comprobar"}
        </button>
      </div>

      {done && (
        <p className="mt-3 text-sm font-semibold text-emerald-700">
          {built.join(" ") === correctWords.join(" ")
            ? "¡Excelente! Ordenaste el versículo correctamente."
            : "Casi, intenta otra vez para ganar XP."}
        </p>
      )}
    </motion.section>
  );
}
