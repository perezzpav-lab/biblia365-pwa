"use client";

import { motion } from "framer-motion";
import {
  Gamepad2,
  ListChecks,
  Puzzle,
  Search,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Wand2,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CharacterMatchChallenge from "@/components/CharacterMatchChallenge";
import ReadingAudioPlayer from "@/components/ReadingAudioPlayer";
import TriviaChallenge from "@/components/TriviaChallenge";
import TrueFalseChallenge from "@/components/TrueFalseChallenge";
import VerseOrderChallenge from "@/components/VerseOrderChallenge";
import WordSprintChallenge from "@/components/WordSprintChallenge";
import WordSearchChallenge from "@/components/WordSearchChallenge";
import type { ModoLectura } from "@/components/home/ModeSwitcher";

type GameResult = {
  xp: number;
  perfect: boolean;
  correctAnswers?: number;
  timeSeconds?: number;
  source?: "trivia" | "verse_order";
};

type Props = {
  mode: ModoLectura;
  onFinish: (result: GameResult) => Promise<void> | void;
};

type GameKey = "trivia" | "verseOrder" | "trueFalse" | "character" | "sprint" | "wordSearch";

const GAME_TABS: Array<{ key: GameKey; label: string; Icon: typeof Sparkles }> = [
  { key: "trivia", label: "Trivia Pro", Icon: Sparkles },
  { key: "verseOrder", label: "Ordena Verso", Icon: ListChecks },
  { key: "trueFalse", label: "V/F", Icon: Wand2 },
  { key: "character", label: "Personajes", Icon: Users },
  { key: "sprint", label: "Word Sprint", Icon: Puzzle },
  { key: "wordSearch", label: "Sopa Bíblica", Icon: Search },
];

export default function MiniGamesHub({ mode, onFinish }: Props) {
  const router = useRouter();
  const [activeGame, setActiveGame] = useState<GameKey>("trivia");
  const greetedRef = useRef(false);
  const greetingText = "¡Hola Eliana! ¿Lista para jugar y aprender?";

  const triggerGreeting = () => {
    if (mode !== "nino" || greetedRef.current) return;
    greetedRef.current = true;
    const utterance = new SpeechSynthesisUtterance(greetingText);
    utterance.lang = "es-MX";
    utterance.rate = 1;
    utterance.pitch = 1.08;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };

  const gameNode = useMemo(() => {
    if (activeGame === "trivia") {
      return <TriviaChallenge mode={mode} onFinish={onFinish} />;
    }
    if (activeGame === "verseOrder") {
      return (
        <VerseOrderChallenge
          mode={mode}
          onFinish={async ({ xp, perfect, timeSeconds }) =>
            onFinish({ xp, perfect, timeSeconds, source: "verse_order" })
          }
        />
      );
    }
    if (activeGame === "trueFalse") {
      return <TrueFalseChallenge mode={mode} onFinish={onFinish} />;
    }
    if (activeGame === "character") {
      return <CharacterMatchChallenge mode={mode} onFinish={onFinish} />;
    }
    if (activeGame === "wordSearch") {
      return <WordSearchChallenge mode={mode} onFinish={onFinish} />;
    }
    return <WordSprintChallenge mode={mode} onFinish={onFinish} />;
  }, [activeGame, mode, onFinish]);

  const isKidMode = mode === "nino";

  return (
    <section
      onMouseEnter={triggerGreeting}
      onTouchStart={triggerGreeting}
      className={`rounded-3xl border p-4 shadow-xl ${
        isKidMode ? "border-sky-200 bg-gradient-to-b from-sky-50 to-amber-50" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <Gamepad2 className={`${isKidMode ? "h-6 w-6 text-sky-600" : "h-4 w-4 text-emerald-700"}`} />
          Zona de Minijuegos
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/duelo")}
            className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-800"
          >
            <Swords className="h-3.5 w-3.5" />
            Duelo
          </button>
          <button
            type="button"
            onClick={() => router.push("/hall-of-fame")}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800"
          >
            <Trophy className="h-3.5 w-3.5" />
            Hall of Fame
          </button>
        </div>
      </div>

      {isKidMode && (
        <div className="mb-3 rounded-2xl border border-amber-200 bg-white/70 p-3">
          <p className="mb-2 text-xs font-semibold text-amber-900">🎉 Mensaje para Eliana</p>
          <ReadingAudioPlayer text={greetingText} />
        </div>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {GAME_TABS.map((tab) => {
          const active = tab.key === activeGame;
          const Icon = tab.Icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveGame(tab.key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isKidMode
                  ? active
                    ? "border-orange-300 bg-gradient-to-r from-amber-200 to-orange-200 text-orange-900"
                    : "border-sky-200 bg-sky-100 text-sky-800 hover:border-amber-300"
                  : active
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon className={isKidMode ? "h-5 w-5" : "h-3.5 w-3.5"} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeGame}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {gameNode}
      </motion.div>
    </section>
  );
}
