"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { ModoLectura } from "@/components/home/ModeSwitcher";

type Props = {
  mode: ModoLectura;
  onFinish: (result: { xp: number; perfect: boolean; correctAnswers: number }) => Promise<void> | void;
};

type MatchQuestion = {
  prompt: string;
  options: string[];
  correct: number;
};

const BANK: Record<ModoLectura, MatchQuestion[]> = {
  adulto: [
    { prompt: "¿Quién escribió muchos salmos?", options: ["David", "Saúl", "Pilato"], correct: 0 },
    { prompt: "¿Quién recibió los Diez Mandamientos?", options: ["Abraham", "Moisés", "Samuel"], correct: 1 },
    { prompt: "¿Quién negó a Jesús tres veces?", options: ["Juan", "Pedro", "Pablo"], correct: 1 },
  ],
  joven: [
    { prompt: "¿Quién derrotó a Goliat?", options: ["David", "Jonás", "Elías"], correct: 0 },
    { prompt: "¿Quién fue tragado por un gran pez?", options: ["Pedro", "Jonás", "Jacob"], correct: 1 },
    { prompt: "¿Quién construyó el arca?", options: ["Noé", "Moisés", "Daniel"], correct: 0 },
  ],
  nino: [
    {
      prompt: "¿Quién cuidaba ovejitas y luego fue rey?",
      options: ["🐑👑 David", "👑 Faraón", "🏰 Herodes"],
      correct: 0,
    },
    {
      prompt: "¿Quién vivió en el arca con animales?",
      options: ["⛵🐘 Noé", "👘 José", "📜 Pablo"],
      correct: 0,
    },
    {
      prompt: "¿Quién oró en el vientre del pez?",
      options: ["⛵🐋 Jonás", "🦁 Daniel", "📘 Timoteo"],
      correct: 0,
    },
  ],
};

export default function CharacterMatchChallenge({ mode, onFinish }: Props) {
  const questions = useMemo(() => BANK[mode], [mode]);
  const isKidMode = mode === "nino";
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const current = questions[index];

  const pick = (idx: number) => {
    if (finished) return;
    if (idx === current.correct) setCorrect((c) => c + 1);
    if (index === questions.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  const finish = async () => {
    const perfect = correct === questions.length;
    const xp = correct * 8 + (perfect ? 8 : 0);
    setSaving(true);
    await onFinish({ xp, perfect, correctAnswers: correct });
    setSaving(false);
  };

  return (
    <section
      className={`rounded-3xl border p-4 shadow-lg ${
        isKidMode ? "border-sky-200 bg-gradient-to-b from-sky-50 to-amber-50" : "border-zinc-200 bg-white"
      }`}
    >
      <p className="text-sm font-semibold text-zinc-900">Juego 4: Personajes Bíblicos</p>
      {!finished ? (
        <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <p className="text-sm text-zinc-800">({index + 1}/3) {current.prompt}</p>
          <div className="mt-3 space-y-2">
            {current.options.map((opt, idx) => (
              <button
                key={opt}
                type="button"
                onClick={() => pick(idx)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                  isKidMode
                    ? "border-sky-300 bg-white text-sky-900 hover:border-orange-300"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-emerald-400"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="mt-3">
          <p className="text-sm font-semibold text-zinc-900">Aciertos: {correct}/3</p>
          <button type="button" onClick={() => void finish()} disabled={saving} className="mt-3 w-full rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">
            {saving ? "Guardando..." : "Guardar resultado"}
          </button>
        </div>
      )}
    </section>
  );
}
