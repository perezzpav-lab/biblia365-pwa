"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock3, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ModoLectura } from "@/components/home/ModeSwitcher";

type TriviaChallengeProps = {
  mode: ModoLectura;
  onFinish: (result: { xp: number; perfect: boolean; correctAnswers: number }) => Promise<void> | void;
};

type TriviaQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

const TIME_PER_QUESTION = 20;

const QUESTIONS: Record<ModoLectura, TriviaQuestion[]> = {
  adulto: [
    {
      id: "a1",
      question: "¿Cuál es la idea central de Mateo 6:33?",
      options: ["Buscar primero el reino de Dios", "Acumular tesoros", "Evitar la oración", "Temer al futuro"],
      correctIndex: 0,
    },
    {
      id: "a2",
      question: "¿Qué implica vivir por fe según Hebreos 11:1?",
      options: ["Negar la razón", "Confiar en lo que Dios prometió", "Esperar sin obedecer", "No tomar decisiones"],
      correctIndex: 1,
    },
    {
      id: "a3",
      question: "¿Qué fruto del Espíritu protege relaciones sanas?",
      options: ["Impaciencia", "Vanagloria", "Amor", "Dureza"],
      correctIndex: 2,
    },
    {
      id: "a4",
      question: "¿Qué práctica fortalece la renovación de la mente?",
      options: ["Meditar en la Palabra", "Compararse con otros", "Evitar comunidad", "Ignorar corrección"],
      correctIndex: 0,
    },
    {
      id: "a5",
      question: "¿Cuál es una respuesta bíblica a la ansiedad?",
      options: ["Controlarlo todo", "Orar y confiar en Dios", "Aislarse", "Rendirse al miedo"],
      correctIndex: 1,
    },
  ],
  joven: [
    {
      id: "j1",
      question: "¿Qué significa poner a Dios primero?",
      options: ["Recordarlo solo los domingos", "Buscar su voluntad cada día", "Orar solo en problemas", "No planear nada"],
      correctIndex: 1,
    },
    {
      id: "j2",
      question: "¿Qué te ayuda a mantener una racha espiritual?",
      options: ["Disciplina diaria", "Motivación ocasional", "Presión social", "Solo emociones"],
      correctIndex: 0,
    },
    {
      id: "j3",
      question: "¿Qué actitud refleja el amor de Cristo?",
      options: ["Orgullo", "Servicio", "Envidia", "Apatía"],
      correctIndex: 1,
    },
    {
      id: "j4",
      question: "¿Qué hacer cuando fallas?",
      options: ["Esconderte", "Arrepentirte y volver a empezar", "Rendirte", "Culpar a otros"],
      correctIndex: 1,
    },
    {
      id: "j5",
      question: "¿Qué práctica te mantiene firme en la fe?",
      options: ["Compararte", "Leer y aplicar la Biblia", "Evitar consejo", "Ignorar oración"],
      correctIndex: 1,
    },
  ],
  nino: [
    {
      id: "n1",
      question: "¿Qué le gusta a Jesús que hagamos?",
      options: ["Pelearnos", "Amar y ayudar", "Mentir", "Gritar siempre"],
      correctIndex: 1,
    },
    {
      id: "n2",
      question: "Si un amigo está triste, ¿qué hacemos?",
      options: ["Nos burlamos", "Lo dejamos solo", "Le damos amor y oración", "Lo ignoramos"],
      correctIndex: 2,
    },
    {
      id: "n3",
      question: "¿Cómo hablamos con Dios?",
      options: ["Con oración", "Solo con gritos", "No se puede", "Con enojo siempre"],
      correctIndex: 0,
    },
    {
      id: "n4",
      question: "¿Qué animal recuerda cuidado y ternura en la Biblia?",
      options: ["León rugiendo", "Corderito", "Serpiente", "Lobo"],
      correctIndex: 1,
    },
    {
      id: "n5",
      question: "¿Qué hacemos con la Palabra de Dios?",
      options: ["La olvidamos", "La leemos y obedecemos", "La rompemos", "Nos da sueño siempre"],
      correctIndex: 1,
    },
  ],
};

export default function TriviaChallenge({ mode, onFinish }: TriviaChallengeProps) {
  const questions = useMemo(() => QUESTIONS[mode].slice(0, 5), [mode]);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [xp, setXp] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = questions[index];

  useEffect(() => {
    if (finished) return;

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (index === questions.length - 1) {
            setFinished(true);
            return 0;
          }
          setIndex((currentIndex) => currentIndex + 1);
          return TIME_PER_QUESTION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [finished, index, questions.length]);

  const answer = (optionIndex: number) => {
    if (finished) return;

    const isCorrect = optionIndex === current.correctIndex;
    let earned = 0;
    if (isCorrect) {
      earned += 10;
      if (timeLeft > 15) {
        earned += 5;
      }
      setCorrect((prev) => prev + 1);
    }
    setXp((prev) => prev + earned);

    if (index === questions.length - 1) {
      setFinished(true);
      return;
    }

    setIndex((prev) => prev + 1);
    setTimeLeft(TIME_PER_QUESTION);
  };

  const finishAndSave = async () => {
    setSaving(true);
    await onFinish({
      xp,
      perfect: correct === questions.length,
      correctAnswers: correct,
    });
    setSaving(false);
  };

  const kidDecor = mode === "nino";

  return (
    <section className={`rounded-3xl border p-4 shadow-lg ${kidDecor ? "border-sky-200 bg-sky-50" : "border-zinc-200 bg-white"}`}>
      <header className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-800">Trivia Pro</p>
        <div className="inline-flex items-center gap-2 text-xs text-zinc-600">
          <Clock3 className="h-3.5 w-3.5" />
          {timeLeft}s
        </div>
      </header>

      {finished ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-zinc-900">
            {correct === questions.length ? "¡Sabio de la Palabra!" : "¡Buen trabajo!"}
          </p>
          {kidDecor && (
            <p className="inline-flex items-center gap-2 text-sm text-sky-700">
              <Star className="h-4 w-4" />
              Estrellitas y animalitos celebran contigo
              <Sparkles className="h-4 w-4" />
            </p>
          )}
          <p className="text-sm text-zinc-700">
            Aciertos: {correct}/5 · XP ganado: {xp}
          </p>
          <button
            type="button"
            onClick={() => void finishAndSave()}
            disabled={saving}
            className="w-full rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
          >
            {saving ? "Guardando XP..." : "Guardar resultado"}
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <p className="mb-3 text-sm font-medium text-zinc-800">
              Pregunta {index + 1}/5: {current.question}
            </p>
            <div className="space-y-2">
              {current.options.map((opt, optIndex) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => answer(optIndex)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    kidDecor
                      ? "border-sky-200 bg-white hover:border-sky-400"
                      : "border-zinc-200 bg-white hover:border-emerald-400"
                  }`}
                >
                  {kidDecor && <span className="mr-2">⭐</span>}
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
}
