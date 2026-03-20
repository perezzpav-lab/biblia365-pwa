"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

type ReadingAudioPlayerProps = {
  text: string;
};

export default function ReadingAudioPlayer({ text }: ReadingAudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);

  const stopAll = () => {
    speechSynthesis.cancel();
    loopRef.current?.stop();
    Tone.Transport.stop();
    setPlaying(false);
  };

  const startAudio = async () => {
    await Tone.start();

    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 1.8, decay: 1.2, sustain: 0.3, release: 2.2 },
      }).toDestination();
    }

    if (!loopRef.current) {
      const chord = ["C4", "E4", "G4"];
      loopRef.current = new Tone.Loop((time) => {
        synthRef.current?.triggerAttackRelease(chord, "2n", time, 0.09);
      }, "2n");
    }

    loopRef.current.start(0);
    Tone.Transport.start();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    utterance.rate = 0.95;
    utterance.pitch = 1.02;
    utterance.onend = () => stopAll();
    speechSynthesis.speak(utterance);
    setPlaying(true);
  };

  const toggle = async () => {
    if (playing) {
      stopAll();
      return;
    }
    await startAudio();
  };

  useEffect(() => {
    return () => {
      stopAll();
      loopRef.current?.dispose();
      synthRef.current?.dispose();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-emerald-400"
    >
      {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      <Volume2 className="h-4 w-4" />
      {playing ? "Detener audio" : "Escuchar con música"}
    </button>
  );
}
