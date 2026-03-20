"use client";

import { motion } from "framer-motion";
import { Timer } from "lucide-react";
import { useMemo, useState } from "react";
import type { ModoLectura } from "@/components/home/ModeSwitcher";

type Props = {
  mode: ModoLectura;
  onFinish: (result: { xp: number; perfect: boolean; correctAnswers: number }) => Promise<void> | void;
};

type SprintItem = {
  sentence: string;
  options: string[];
  correct: number;
};

const BANK: Record<ModoLectura, SprintItem[]> = {
  adulto: [
    { sentence: "La fe viene por el oír, y el oír por la ____.", options: ["cultura", "Palabra de Dios", "tradición"], correct: 1 },
    { sentence: "Dios resiste a los soberbios y da gracia a los ____.", options: ["humildes", "fuertes", "sabios"], correct: 0 },
    { sentence: "El fruto del Espíritu es ____.", options: ["amor", "miedo", "enojo"], correct: 0 },
  ],
  joven: [
    { sentence: "Tu palabra es lámpara a mis ____.", options: ["manos", "pies", "ojos"], correct: 1 },
    { sentence: "Todo lo puedo en ____ que me fortalece.", options: ["mi esfuerzo", "Cristo", "el tiempo"], correct: 1 },
    { sentence: "Buscad primeramente el reino de ____.", options: ["la gente", "Dios", "la fama"], correct: 1 },
  ],
  nino: [
    { sentence: "Jesús me ama, esto sé, porque la ____ lo dice.", options: ["Biblia", "tele", "escuela"], correct: 0 },
    { sentence: "Dios hizo el cielo y la ____.", options: ["tierra", "tarea", "sopa"], correct: 0 },
    { sentence: "Orar es hablar con ____.", options: ["internet", "Dios", "robot"], correct: 1 },
  ],
};

export default function WordSprintChallenge({ mode, onFinish }: Props) {
  const items = useMemo(() => BANK[mode], [mode]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [startAt] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = items[index];

  const answer = (idx: number) => {
    if (finished) return;
    if (idx === current.correct) setCorrect((c) => c + 1);
    if (index === items.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  const finish = async () => {
    const elapsed = Math.max(1, Math.floor((Date.now() - startAt) / 1000));
    const perfect = correct === items.length;
    let xp = correct * 7;
    if (perfect) xp += 10;
    if (elapsed <= 15) xp += 5;
    setSaving(true);
    await onFinish({ xp, perfect, correctAnswers: correct });
    setSaving(false);
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-lg">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <Timer className="h-4 w-4 text-emerald-700" />
        Juego 5: Word Sprint Bíblico
      </p>
      {!finished ? (
        <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <p className="text-sm text-zinc-800">({index + 1}/3) {current.sentence}</p>
          <div className="mt-3 space-y-2">
            {current.options.map((opt, idx) => (
              <button key={opt} type="button" onClick={() => answer(idx)} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-left text-sm text-zinc-700 transition hover:border-emerald-400">
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
