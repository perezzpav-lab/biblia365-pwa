"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

type ReadingAudioPlayerProps = {
  /** Texto a narrar (misma API que antes). */
  text: string;
  /** Igual que el Lector de Biblia: es-MX o en-US */
  language?: "es" | "en";
};

/**
 * Narración con Web Speech API — misma lógica que `app/biblia/page.tsx` (sin sintetizador musical).
 */
export default function ReadingAudioPlayer({ text, language = "es" }: ReadingAudioPlayerProps) {
  const [playing, setPlaying] = useState(false);

  const stop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  };

  const start = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(trimmed);
    u.lang = language === "en" ? "en-US" : "es-MX";
    u.rate = 0.95;
    u.pitch = 1.02;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(u);
    setPlaying(true);
  };

  const toggle = () => {
    if (playing) {
      stop();
      return;
    }
    start();
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => toggle()}
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-emerald-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
    >
      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      <Volume2 className="h-4 w-4" />
      {playing ? "Detener" : "Escuchar"}
    </button>
  );
}
