"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ModoLectura } from "@/components/home/ModeSwitcher";

type Props = {
  mode: ModoLectura;
  onFinish: (result: { xp: number; perfect: boolean; correctAnswers: number }) => Promise<void> | void;
};

type Item = { statement: string; answer: boolean };

const BANK: Record<ModoLectura, Item[]> = {
  adulto: [
    { statement: "La fe bíblica se expresa también en obediencia diaria.", answer: true },
    { statement: "La ansiedad se vence solo con fuerza de voluntad.", answer: false },
    { statement: "Perdonar refleja el carácter de Cristo.", answer: true },
    { statement: "La oración es opcional para crecer espiritualmente.", answer: false },
    { statement: "La Palabra transforma la mente y las decisiones.", answer: true },
  ],
  joven: [
    { statement: "Ser discípulo incluye disciplina y constancia.", answer: true },
    { statement: "Dios solo habla en momentos extraordinarios.", answer: false },
    { statement: "Tus palabras pueden dar vida o herir.", answer: true },
    { statement: "No necesitas comunidad para crecer en la fe.", answer: false },
    { statement: "La Biblia te ayuda a tomar mejores decisiones.", answer: true },
  ],
  nino: [
    { statement: "Jesús quiere que amemos a los demás.", answer: true },
    { statement: "Orar es hablar con Dios.", answer: true },
    { statement: "Está bien mentir si nadie te ve.", answer: false },
    { statement: "Ayudar en casa también honra a Dios.", answer: true },
    { statement: "La Biblia es aburrida y no enseña nada.", answer: false },
  ],
};

export default function TrueFalseChallenge({ mode, onFinish }: Props) {
  const items = useMemo(() => BANK[mode], [mode]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = items[index];

  const answer = (value: boolean) => {
    if (finished) return;
    if (value === current.answer) setCorrect((c) => c + 1);

    if (index === items.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  const finish = async () => {
    const perfect = correct === items.length;
    const xp = correct * 6 + (perfect ? 10 : 0);
    setSaving(true);
    await onFinish({ xp, perfect, correctAnswers: correct });
    setSaving(false);
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-lg">
      <p className="text-sm font-semibold text-zinc-900">Juego 3: Verdadero o Falso</p>
      {!finished ? (
        <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <p className="text-sm text-zinc-800">({index + 1}/5) {current.statement}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => answer(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">
              <Check className="h-4 w-4" /> Verdadero
            </button>
            <button type="button" onClick={() => answer(false)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700">
              <X className="h-4 w-4" /> Falso
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="mt-3">
          <p className="text-sm font-semibold text-zinc-900">Aciertos: {correct}/5</p>
          <button type="button" onClick={() => void finish()} disabled={saving} className="mt-3 w-full rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">
            {saving ? "Guardando..." : "Guardar resultado"}
          </button>
        </div>
      )}
    </section>
  );
}
