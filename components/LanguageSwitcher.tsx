"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-2 py-1">
      <Languages className="h-4 w-4 text-zinc-600" />
      <button
        type="button"
        onClick={() => setLanguage("es")}
        className={`rounded-md px-2 py-1 text-xs font-semibold ${
          language === "es" ? "bg-emerald-600 text-white" : "text-zinc-600"
        }`}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-md px-2 py-1 text-xs font-semibold ${
          language === "en" ? "bg-emerald-600 text-white" : "text-zinc-600"
        }`}
      >
        EN
      </button>
    </div>
  );
}
