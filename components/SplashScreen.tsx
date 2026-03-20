"use client";

import { motion } from "framer-motion";
import { BookOpenText } from "lucide-react";

type Props = {
  visible: boolean;
};

export default function SplashScreen({ visible }: Props) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-800"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.55 }}
        className="relative rounded-3xl border border-amber-300/40 bg-white/10 px-8 py-6 text-center shadow-2xl backdrop-blur"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-amber-300/20 via-yellow-200/20 to-amber-100/10 blur-xl" />
        <BookOpenText className="mx-auto h-12 w-12 text-amber-300" />
        <p className="mt-3 text-2xl font-semibold tracking-wide text-white">Biblia 365</p>
        <p className="mt-1 text-xs text-amber-200">Tu pan diario en la Palabra</p>
      </motion.div>
    </motion.div>
  );
}
