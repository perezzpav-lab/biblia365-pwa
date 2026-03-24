"use client";

import { motion } from "framer-motion";
import { Share2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DB_BIBLE_VERSIONS } from "@/lib/bible-versions";

type VerseRef = {
  book: string;
  chapter: number;
  verse: number;
};

type VersionVerse = {
  version: string;
  text: string;
};

function getDayOfYear(now: Date) {
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

const BG_CYCLE = [
  "from-amber-200 via-yellow-100 to-orange-100",
  "from-emerald-200 via-green-100 to-teal-100",
  "from-sky-200 via-cyan-100 to-indigo-100",
  "from-rose-200 via-pink-100 to-fuchsia-100",
  "from-violet-200 via-purple-100 to-indigo-100",
  "from-lime-200 via-green-100 to-emerald-100",
];

async function fetchNetVerse(book: string, chapter: number, verse: number): Promise<string | null> {
  try {
    const r = await fetch(
      `/api/bible/chapter?version=NET&book=${encodeURIComponent(book)}&chapter=${chapter}`,
    );
    const j = (await r.json()) as { verses?: Array<{ verse: number; text: string }>; error?: string };
    if (!r.ok || !j.verses) return null;
    const row = j.verses.find((v) => v.verse === verse);
    return row?.text ?? null;
  } catch {
    return null;
  }
}

export default function DailyVerseCard() {
  const [reference, setReference] = useState<VerseRef | null>(null);
  const [verses, setVerses] = useState<VersionVerse[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { count, error: countError } = await supabase
        .from("bible_text")
        .select("*", { count: "exact", head: true })
        .eq("version", "RV1909");

      if (countError || !count || count <= 0) {
        setStatus(
          "Sin RV1909 en la base: sube un JSON completo con npm run seed:bible. Mientras tanto puedes leer NET en inglés en el lector.",
        );
        const day = getDayOfYear(new Date());
        const fallback: VerseRef = { book: "Salmos", chapter: 23, verse: 1 };
        setReference(fallback);
        const net = await fetchNetVerse(fallback.book, fallback.chapter, fallback.verse);
        setVerses(net ? [{ version: "NET (inglés, en línea)", text: net }] : []);
        return;
      }

      const offset = getDayOfYear(new Date()) % count;
      const { data: baseData, error: baseError } = await supabase
        .from("bible_text")
        .select("book, chapter, verse")
        .eq("version", "RV1909")
        .order("book", { ascending: true })
        .order("chapter", { ascending: true })
        .order("verse", { ascending: true })
        .range(offset, offset)
        .maybeSingle<{ book: string; chapter: number; verse: number }>();

      if (baseError || !baseData) {
        setStatus("No se pudo calcular el versículo del día.");
        return;
      }

      setReference(baseData);
      const texts: VersionVerse[] = [];

      for (const version of DB_BIBLE_VERSIONS) {
        const { data } = await supabase
          .from("bible_text")
          .select("text")
          .eq("version", version)
          .eq("book", baseData.book)
          .eq("chapter", baseData.chapter)
          .eq("verse", baseData.verse)
          .maybeSingle<{ text: string }>();
        const t = data?.text?.trim();
        texts.push({
          version,
          text: t && t.length > 0 ? t : "Sin versículo cargado para esta versión.",
        });
      }

      const netText = await fetchNetVerse(baseData.book, baseData.chapter, baseData.verse);
      if (netText) {
        texts.push({ version: "NET (inglés)", text: netText });
      }

      setVerses(texts);
    };

    void load();
  }, []);

  const title = useMemo(() => {
    if (!reference) return "Versículo del Día";
    return `Versículo del Día · ${reference.book} ${reference.chapter}:${reference.verse}`;
  }, [reference]);

  const shareVerse = (item: VersionVerse) => {
    if (!reference) return;
    const text = `${title}\n${item.version}\n${item.text}\n\nBiblia 365`;
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-xl">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <Sparkles className="h-4 w-4 text-amber-600" />
        {title}
      </p>
      {status ? <p className="mt-2 text-xs text-zinc-600">{status}</p> : null}
      {verses.length > 0 ? (
        <div className="mt-3 space-y-2">
          {verses.map((item, idx) => (
            <motion.div
              key={`${item.version}-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className={`rounded-2xl border border-white/70 bg-gradient-to-r ${BG_CYCLE[idx % BG_CYCLE.length]} p-3`}
            >
              <p className="text-xs font-semibold text-zinc-800">{item.version}</p>
              <p className="mt-1 text-sm leading-6 text-zinc-900">{item.text}</p>
              <button
                type="button"
                onClick={() => shareVerse(item)}
                className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1 text-xs font-semibold text-zinc-800"
              >
                <Share2 className="h-3.5 w-3.5" />
                Compartir
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        !status && <p className="mt-2 text-xs text-zinc-500">Cargando…</p>
      )}
    </section>
  );
}
