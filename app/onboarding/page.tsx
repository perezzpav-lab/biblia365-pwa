"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpenText, Gift, HeartHandshake, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ModoInicial = "adulto" | "joven" | "nino";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const ONBOARDING_KEY = "hasSeenOnboarding";
const DEFAULT_MODE_KEY = "biblia365_default_mode";

const PASOS = [
  {
    id: 1,
    titulo: "365 Días en la Palabra",
    descripcion:
      "Un recorrido diario por la Biblia para fortalecer tu fe con lectura, reflexión y oración.",
    icono: BookOpenText,
  },
  {
    id: 2,
    titulo: "Retos y Recompensas",
    descripcion:
      "Evalúa tu comprensión en el camino y desbloquea avances espirituales cada 30 días.",
    icono: Gift,
  },
  {
    id: 3,
    titulo: "Para toda la familia",
    descripcion:
      "Elige tu modo inicial y disfruta un plan adaptado para adultos, jóvenes y niños.",
    icono: HeartHandshake,
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [pasoActual, setPasoActual] = useState(0);
  const [modoInicial, setModoInicial] = useState<ModoInicial>("adulto");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  const avanzar = () => {
    setPasoActual((prev) => Math.min(PASOS.length - 1, prev + 1));
  };

  const retroceder = () => {
    setPasoActual((prev) => Math.max(0, prev - 1));
  };

  const comenzar = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    localStorage.setItem(DEFAULT_MODE_KEY, modoInicial);
    router.replace("/");
  };

  const instalarApp = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const PasoIcono = PASOS[pasoActual].icono;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-stone-50 to-stone-100 px-4 py-8">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-700" />
          <p className="text-sm font-semibold tracking-wide text-emerald-700">Bienvenido a Biblia 365</p>
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.section
              key={PASOS[pasoActual].id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl bg-zinc-50 p-5 text-center"
            >
              <PasoIcono className="mx-auto mb-4 h-12 w-12 text-emerald-700" />
              <h1 className="font-serif text-2xl font-semibold text-zinc-900">{PASOS[pasoActual].titulo}</h1>
              <p className="mt-3 text-sm leading-7 text-zinc-600">{PASOS[pasoActual].descripcion}</p>

              {pasoActual === 2 && (
                <div className="mt-5 rounded-2xl bg-white p-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Modo inicial
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["adulto", "joven", "nino"] as const).map((modo) => (
                      <button
                        key={modo}
                        type="button"
                        onClick={() => setModoInicial(modo)}
                        className={`min-h-10 rounded-xl text-sm font-medium transition ${
                          modoInicial === modo
                            ? "bg-emerald-700 text-white"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        {modo === "adulto" ? "Adulto" : modo === "joven" ? "Joven" : "Niños"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.section>
          </AnimatePresence>

          <div className="mt-4 flex items-center justify-center gap-2">
            {PASOS.map((paso, index) => (
              <div
                key={paso.id}
                className={`h-1.5 rounded-full transition-all ${
                  index === pasoActual ? "w-8 bg-emerald-700" : "w-2 bg-zinc-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={retroceder}
            disabled={pasoActual === 0}
            className="min-h-11 rounded-2xl border border-zinc-200 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={avanzar}
            disabled={pasoActual === PASOS.length - 1}
            className="min-h-11 rounded-2xl border border-zinc-200 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>

        <motion.button
          type="button"
          onClick={comenzar}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="mt-4 min-h-12 w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-800"
        >
          Comenzar mi viaje
        </motion.button>

        <button
          type="button"
          onClick={() => void instalarApp()}
          disabled={!deferredPrompt}
          className="mt-3 min-h-11 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Instalar App
        </button>
      </main>
    </div>
  );
}
