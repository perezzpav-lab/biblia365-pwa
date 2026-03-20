"use client";

import { BookOpenText, Columns2, Loader2, Play, Search, Share2, Sparkles, Square } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";
import { supabase } from "@/lib/supabase";

type BibleVersion = "RV1909" | "NVI" | "TLA";
type VerseRow = { verse: number; text: string };
type SearchResult = { version: BibleVersion; book: string; chapter: number; verse: number; text: string };
type ReaderMode = "adulto" | "joven" | "nino";

const DEFAULT_MODE_KEY = "biblia365_default_mode";
const VERSIONS: BibleVersion[] = ["RV1909", "NVI", "TLA"];

const MODE_THEMES: Record<ReaderMode, {
  bg: string;
  card: string;
  cardGlow: string;
  heading: string;
  text: string;
  muted: string;
  verseBadge: string;
  verseBadgeCompare: string;
  accent: string;
  accentSoft: string;
  input: string;
  dailyCard: (idx: number) => string;
  dailyGlow: string;
  pillActive: string;
  pillInactive: string;
  searchBtn: string;
  narrationBtn: string;
}> = {
  adulto: {
    bg: "bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900",
    card: "bg-black/30 border-emerald-500/20 backdrop-blur-xl",
    cardGlow: "shadow-[0_0_40px_rgba(16,185,129,0.12),0_0_80px_rgba(16,185,129,0.06)]",
    heading: "text-emerald-300",
    text: "text-white",
    muted: "text-emerald-200/70",
    verseBadge: "border-emerald-400/60 bg-emerald-500/20 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    verseBadgeCompare: "border-amber-400/60 bg-amber-500/20 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    accent: "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]",
    accentSoft: "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    input: "border-emerald-500/30 bg-black/40 text-white placeholder:text-emerald-300/40",
    dailyCard: (idx: number) => [
      "from-emerald-900/60 via-emerald-800/40 to-teal-900/60 border-emerald-400/30 shadow-[0_0_24px_rgba(16,185,129,0.3)]",
      "from-amber-900/50 via-yellow-900/30 to-amber-800/50 border-amber-400/30 shadow-[0_0_24px_rgba(245,158,11,0.25)]",
      "from-cyan-900/50 via-teal-900/30 to-cyan-800/50 border-cyan-400/30 shadow-[0_0_24px_rgba(6,182,212,0.25)]",
    ][idx % 3],
    dailyGlow: "text-emerald-200",
    pillActive: "bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.6)]",
    pillInactive: "text-emerald-300/60 hover:text-emerald-200",
    searchBtn: "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-[0_0_16px_rgba(16,185,129,0.4)]",
    narrationBtn: "border-emerald-400/40 bg-emerald-600/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
  },
  joven: {
    bg: "bg-gradient-to-br from-violet-950 via-fuchsia-950 to-indigo-950",
    card: "bg-black/30 border-violet-500/20 backdrop-blur-xl",
    cardGlow: "shadow-[0_0_40px_rgba(139,92,246,0.15),0_0_80px_rgba(217,70,239,0.08)]",
    heading: "text-fuchsia-300",
    text: "text-white",
    muted: "text-violet-200/70",
    verseBadge: "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-300 shadow-[0_0_8px_rgba(217,70,239,0.5)]",
    verseBadgeCompare: "border-cyan-400/60 bg-cyan-500/20 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.5)]",
    accent: "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)]",
    accentSoft: "border border-violet-400/30 bg-violet-500/10 text-violet-300",
    input: "border-violet-500/30 bg-black/40 text-white placeholder:text-violet-300/40",
    dailyCard: (idx: number) => [
      "from-fuchsia-900/60 via-violet-800/40 to-pink-900/60 border-fuchsia-400/30 shadow-[0_0_24px_rgba(217,70,239,0.35)]",
      "from-violet-900/50 via-indigo-900/30 to-violet-800/50 border-violet-400/30 shadow-[0_0_24px_rgba(139,92,246,0.3)]",
      "from-cyan-900/50 via-blue-900/30 to-cyan-800/50 border-cyan-400/30 shadow-[0_0_24px_rgba(6,182,212,0.3)]",
    ][idx % 3],
    dailyGlow: "text-fuchsia-200",
    pillActive: "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_0_16px_rgba(217,70,239,0.6)]",
    pillInactive: "text-violet-300/60 hover:text-violet-200",
    searchBtn: "bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-[0_0_16px_rgba(139,92,246,0.4)]",
    narrationBtn: "border-fuchsia-400/40 bg-fuchsia-600/20 text-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.2)]",
  },
  nino: {
    bg: "bg-gradient-to-br from-sky-950 via-cyan-950 to-teal-950",
    card: "bg-black/30 border-sky-500/20 backdrop-blur-xl",
    cardGlow: "shadow-[0_0_40px_rgba(56,189,248,0.15),0_0_80px_rgba(34,211,238,0.08)]",
    heading: "text-cyan-300",
    text: "text-white",
    muted: "text-sky-200/70",
    verseBadge: "border-cyan-400/60 bg-cyan-500/20 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]",
    verseBadgeCompare: "border-amber-400/60 bg-amber-500/20 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.5)]",
    accent: "bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-400 text-white shadow-[0_0_20px_rgba(56,189,248,0.5)]",
    accentSoft: "border border-sky-400/30 bg-sky-500/10 text-sky-300",
    input: "border-sky-500/30 bg-black/40 text-white placeholder:text-sky-300/40",
    dailyCard: (idx: number) => [
      "from-sky-900/60 via-cyan-800/40 to-teal-900/60 border-cyan-400/30 shadow-[0_0_24px_rgba(34,211,238,0.35)]",
      "from-rose-900/50 via-pink-900/30 to-rose-800/50 border-rose-400/30 shadow-[0_0_24px_rgba(251,113,133,0.25)]",
      "from-amber-900/50 via-yellow-900/30 to-amber-800/50 border-amber-400/30 shadow-[0_0_24px_rgba(251,191,36,0.25)]",
    ][idx % 3],
    dailyGlow: "text-cyan-200",
    pillActive: "bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-[0_0_16px_rgba(56,189,248,0.6)]",
    pillInactive: "text-sky-300/60 hover:text-sky-200",
    searchBtn: "bg-gradient-to-r from-sky-500 to-cyan-500 shadow-[0_0_16px_rgba(56,189,248,0.4)]",
    narrationBtn: "border-cyan-400/40 bg-cyan-600/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)]",
  },
};

const SPANISH_BOOKS = [
  "Génesis","Éxodo","Levítico","Números","Deuteronomio","Josué","Jueces","Rut",
  "1 Samuel","2 Samuel","1 Reyes","2 Reyes","1 Crónicas","2 Crónicas","Esdras",
  "Nehemías","Ester","Job","Salmos","Proverbios","Eclesiastés","Cantares",
  "Isaías","Jeremías","Lamentaciones","Ezequiel","Daniel","Oseas","Joel","Amós",
  "Abdías","Jonás","Miqueas","Nahúm","Habacuc","Sofonías","Hageo","Zacarías","Malaquías",
  "Mateo","Marcos","Lucas","Juan","Hechos","Romanos","1 Corintios","2 Corintios",
  "Gálatas","Efesios","Filipenses","Colosenses","1 Tesalonicenses","2 Tesalonicenses",
  "1 Timoteo","2 Timoteo","Tito","Filemón","Hebreos","Santiago","1 Pedro","2 Pedro",
  "1 Juan","2 Juan","3 Juan","Judas","Apocalipsis",
];

function getDayOfYear(now: Date) {
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

const MODE_LABELS: { key: ReaderMode; label: string; emoji: string }[] = [
  { key: "adulto", label: "Adulto", emoji: "📖" },
  { key: "joven", label: "Joven", emoji: "⚡" },
  { key: "nino", label: "Niño", emoji: "🌈" },
];

function BibliaClientPage() {
  const { language } = useLanguage();
  const params = useSearchParams();
  const initialBook = params.get("book") ?? "Génesis";
  const initialChapter = Number(params.get("chapter") ?? "1");

  const [mode, setMode] = useState<ReaderMode>("adulto");
  const [book, setBook] = useState(initialBook);
  const [chapter, setChapter] = useState(Number.isNaN(initialChapter) ? 1 : initialChapter);
  const [primaryVersion, setPrimaryVersion] = useState<BibleVersion>("RV1909");
  const [secondaryVersion, setSecondaryVersion] = useState<BibleVersion>("NVI");
  const [compareMode, setCompareMode] = useState(false);
  const [chapters, setChapters] = useState<number[]>([]);
  const [primaryVerses, setPrimaryVerses] = useState<VerseRow[]>([]);
  const [secondaryVerses, setSecondaryVerses] = useState<VerseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchVersion, setSearchVersion] = useState<BibleVersion>("RV1909");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [dailyReference, setDailyReference] = useState<{ book: string; chapter: number; verse: number } | null>(null);
  const [dailyVerses, setDailyVerses] = useState<Array<{ version: BibleVersion; text: string }>>([]);
  const [isNarrating, setIsNarrating] = useState(false);

  const T = MODE_THEMES[mode];

  const tx = language === "en"
    ? {
        title: "Smart Bible Reader",
        subtitle: "Explore RV1909, NVI and TLA. Compare versions side by side.",
        open: "Open",
        compare: "Compare",
        compareOn: "Compare: On",
        searchPro: "Pro Search",
        searchHint: "Filter by version and search words across the Bible.",
        searchPlaceholder: "Search hope, grace, promise...",
        searchBtn: "Search",
        dailyVerse: "Verse of the Day",
        share: "Share",
        loadingChapter: "Loading chapter...",
        startMsg: "Select book, chapter and version to begin.",
        noContent: "No content for this book/chapter/version.",
      }
    : {
        title: "Lector Bíblico Inteligente",
        subtitle: "Explora RV1909, NVI y TLA. Compara versiones en paralelo.",
        open: "Abrir",
        compare: "Comparar",
        compareOn: "Comparar: Activo",
        searchPro: "Buscador Pro",
        searchHint: "Filtra por versión y encuentra palabras en toda la Biblia.",
        searchPlaceholder: "Buscar esperanza, gracia, promesa...",
        searchBtn: "Buscar",
        dailyVerse: "Versículo del Día",
        share: "Compartir",
        loadingChapter: "Cargando capítulo...",
        startMsg: "Selecciona libro, capítulo y versión para comenzar.",
        noContent: "No hay contenido para ese libro/capítulo/versión.",
      };

  useEffect(() => {
    const stored = localStorage.getItem(DEFAULT_MODE_KEY);
    if (stored === "adulto" || stored === "joven" || stored === "nino") {
      setMode(stored);
      if (stored === "nino") {
        setPrimaryVersion("TLA");
        setSearchVersion("TLA");
        setSecondaryVersion("RV1909");
      }
    }
  }, []);

  const handleModeChange = (next: ReaderMode) => {
    setMode(next);
    localStorage.setItem(DEFAULT_MODE_KEY, next);
    if (next === "nino") {
      setPrimaryVersion("TLA");
      setSearchVersion("TLA");
    }
  };

  useEffect(() => {
    const loadChapters = async () => {
      const { data, error } = await supabase
        .from("bible_text")
        .select("chapter")
        .eq("version", primaryVersion)
        .eq("book", book)
        .order("chapter", { ascending: true })
        .limit(400);
      if (error) { setChapters([]); return; }
      const unique = Array.from(new Set((data ?? []).map((row) => Number((row as { chapter?: number }).chapter)).filter(Number.isFinite)));
      setChapters(unique);
      if (!unique.includes(chapter) && unique.length > 0) setChapter(unique[0]);
    };
    void loadChapters();
  }, [book, chapter, primaryVersion]);

  const loadVersesByVersion = async (version: BibleVersion) => {
    const { data, error } = await supabase
      .from("bible_text").select("verse, text")
      .eq("version", version).eq("book", book).eq("chapter", chapter)
      .order("verse", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      verse: Number((row as { verse?: number }).verse ?? 0),
      text: String((row as { text?: string }).text ?? ""),
    }));
  };

  const loadChapter = async () => {
    setLoading(true); setStatus(null);
    try {
      const primary = await loadVersesByVersion(primaryVersion);
      setPrimaryVerses(primary);
      if (compareMode) { setSecondaryVerses(await loadVersesByVersion(secondaryVersion)); }
      else { setSecondaryVerses([]); }
      if (primary.length === 0) setStatus(tx.noContent);
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setPrimaryVerses([]); setSecondaryVerses([]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadChapter(); }, 0);
    return () => window.clearTimeout(timer);
  }, [book, chapter, primaryVersion, secondaryVersion, compareMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadDailyVerse = async () => {
      const { count } = await supabase.from("bible_text").select("*", { count: "exact", head: true }).eq("version", "RV1909");
      if (!count || count <= 0) return;
      const offset = getDayOfYear(new Date()) % count;
      const { data: base } = await supabase.from("bible_text").select("book, chapter, verse").eq("version", "RV1909")
        .order("book", { ascending: true }).order("chapter", { ascending: true }).order("verse", { ascending: true })
        .range(offset, offset).maybeSingle<{ book: string; chapter: number; verse: number }>();
      if (!base) return;
      setDailyReference(base);
      const texts = await Promise.all(
        VERSIONS.map(async (version) => {
          const { data } = await supabase.from("bible_text").select("text").eq("version", version)
            .eq("book", base.book).eq("chapter", base.chapter).eq("verse", base.verse)
            .maybeSingle<{ text: string }>();
          return { version, text: data?.text ?? "Sin contenido." };
        }),
      );
      setDailyVerses(texts);
    };
    void loadDailyVerse();
  }, []);

  const runSearch = async () => {
    if (!searchTerm.trim()) { setSearchResults([]); return; }
    const { data, error } = await supabase.from("bible_text").select("version, book, chapter, verse, text")
      .eq("version", searchVersion).ilike("text", `%${searchTerm.trim()}%`).limit(40);
    if (error) { setStatus(`Error: ${error.message}`); return; }
    setSearchResults((data ?? []).map((row) => ({
      version: (row as { version?: BibleVersion }).version ?? "RV1909",
      book: String((row as { book?: string }).book ?? ""),
      chapter: Number((row as { chapter?: number }).chapter ?? 0),
      verse: Number((row as { verse?: number }).verse ?? 0),
      text: String((row as { text?: string }).text ?? ""),
    })));
  };

  const shareDaily = (version: BibleVersion, text: string) => {
    if (!dailyReference) return;
    const content = `Versículo del día\n${dailyReference.book} ${dailyReference.chapter}:${dailyReference.verse}\n${version}\n${text}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(content)}`, "_blank", "noopener,noreferrer");
  };

  const chapterOptions = useMemo(
    () => (chapters.length > 0 ? chapters : Array.from({ length: 150 }, (_, i) => i + 1)),
    [chapters],
  );

  const toggleNarration = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { setStatus("Narración no soportada."); return; }
    if (isNarrating) { window.speechSynthesis.cancel(); setIsNarrating(false); return; }
    if (primaryVerses.length === 0) { setStatus("No hay versículos cargados."); return; }
    const text = primaryVerses.map((v) => `Versículo ${v.verse}. ${v.text}`).join(" ");
    const u = new SpeechSynthesisUtterance(`${book} capítulo ${chapter}. ${text}`);
    u.lang = language === "en" ? "en-US" : "es-MX"; u.rate = 0.95;
    u.onend = () => setIsNarrating(false);
    u.onerror = () => { setIsNarrating(false); setStatus("Error de narración."); };
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); setIsNarrating(true);
  };

  useEffect(() => {
    return () => { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, []);

  return (
    <div className={`min-h-screen px-4 py-8 transition-all duration-700 ${T.bg} text-white`}>
      <main className="mx-auto w-full max-w-5xl space-y-5">

        {/* ── MODE SELECTOR (3D pill bar) ── */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-black/30 p-1.5 backdrop-blur-xl">
            {MODE_LABELS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleModeChange(item.key)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-300 ${
                  mode === item.key ? T.pillActive : T.pillInactive
                }`}
              >
                {item.emoji} {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── HEADER CARD (3D float) ── */}
        <section
          className={`rounded-[2rem] border p-6 transition-all duration-500 ${T.card} ${T.cardGlow}`}
          style={{ transform: "perspective(1200px) rotateX(1deg)", transformStyle: "preserve-3d" }}
        >
          <h1 className={`inline-flex items-center gap-2.5 text-2xl font-extrabold tracking-tight ${T.heading}`}>
            <BookOpenText className="h-6 w-6" />
            {tx.title}
          </h1>
          <p className={`mt-1 text-sm ${T.muted}`}>{tx.subtitle}</p>
          <div className="mt-2"><LanguageSwitcher /></div>

          <div className="mt-5 grid grid-cols-1 gap-2 lg:grid-cols-[1fr_130px_150px_auto]">
            <select value={book} onChange={(e) => setBook(e.target.value)} className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${T.input}`}>
              {SPANISH_BOOKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={chapter} onChange={(e) => setChapter(Number(e.target.value))} className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${T.input}`}>
              {chapterOptions.map((c) => <option key={c} value={c}>Cap. {c}</option>)}
            </select>
            <select value={primaryVersion} onChange={(e) => setPrimaryVersion(e.target.value as BibleVersion)} className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${T.input}`}>
              {VERSIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <button type="button" onClick={() => void loadChapter()} className={`rounded-xl px-5 py-2.5 text-sm font-bold ${T.accent}`}>
              <Search className="mr-1.5 inline h-4 w-4" />
              {tx.open}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setCompareMode((p) => !p)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${compareMode ? T.accent : T.accentSoft}`}
            >
              <Columns2 className="h-4 w-4" />
              {compareMode ? tx.compareOn : tx.compare}
            </button>
            {compareMode && (
              <select value={secondaryVersion} onChange={(e) => setSecondaryVersion(e.target.value as BibleVersion)} className={`rounded-xl border px-3 py-2 text-xs font-medium ${T.input}`}>
                {VERSIONS.filter((v) => v !== primaryVersion).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            )}
            <button type="button" onClick={toggleNarration} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${T.narrationBtn}`}>
              {isNarrating ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isNarrating ? "Detener" : "Play narración"}
            </button>
          </div>
          {status && <p className="mt-2 text-xs text-amber-400">{status}</p>}
        </section>

        {/* ── SEARCH PRO ── */}
        <section className={`rounded-[2rem] border p-5 transition-all duration-500 ${T.card} ${T.cardGlow}`}>
          <p className={`text-sm font-bold ${T.heading}`}>{tx.searchPro}</p>
          <p className={`text-xs ${T.muted}`}>{tx.searchHint}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_auto]">
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={tx.searchPlaceholder}
              className={`rounded-xl border px-3 py-2.5 text-sm ${T.input}`} />
            <select value={searchVersion} onChange={(e) => setSearchVersion(e.target.value as BibleVersion)} className={`rounded-xl border px-3 py-2.5 text-sm ${T.input}`}>
              {VERSIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <button type="button" onClick={() => void runSearch()} className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white ${T.searchBtn}`}>{tx.searchBtn}</button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 max-h-72 space-y-2 overflow-auto">
              {searchResults.map((item) => (
                <button key={`${item.version}-${item.book}-${item.chapter}-${item.verse}-${item.text.slice(0, 15)}`}
                  type="button" onClick={() => { setPrimaryVersion(item.version); setBook(item.book); setChapter(item.chapter); }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left backdrop-blur transition hover:bg-white/10"
                >
                  <p className="text-xs font-bold text-white">{item.version} · {item.book} {item.chapter}:{item.verse}</p>
                  <p className="mt-1 text-xs text-white/80">{item.text}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── DAILY VERSE (impactante, neon glow per mode) ── */}
        <section
          className={`rounded-[2rem] border p-6 transition-all duration-500 ${T.card} ${T.cardGlow}`}
          style={{ transform: "perspective(1200px) rotateX(-0.5deg)" }}
        >
          <p className={`inline-flex items-center gap-2 text-sm font-bold ${T.heading}`}>
            <Sparkles className="h-4 w-4" />
            {tx.dailyVerse} {dailyReference ? `· ${dailyReference.book} ${dailyReference.chapter}:${dailyReference.verse}` : ""}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {dailyVerses.map((item, idx) => (
              <div
                key={item.version}
                className={`rounded-2xl border bg-gradient-to-br p-4 transition-all duration-500 hover:scale-[1.02] ${T.dailyCard(idx)}`}
                style={{ transform: "perspective(800px) rotateY(1deg)", transformStyle: "preserve-3d" }}
              >
                <p className={`text-xs font-extrabold uppercase tracking-widest ${T.dailyGlow}`}>{item.version}</p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-white">{item.text}</p>
                <button type="button" onClick={() => shareDaily(item.version, item.text)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <Share2 className="h-3.5 w-3.5" />{tx.share}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── VERSES (the main reading area) ── */}
        <section
          className={`rounded-[2rem] border p-6 transition-all duration-500 ${T.card} ${T.cardGlow}`}
          style={{ transform: "perspective(1200px) rotateX(0.5deg)" }}
        >
          {loading ? (
            <p className={`inline-flex items-center gap-2 text-sm ${T.muted}`}>
              <Loader2 className="h-4 w-4 animate-spin" />{tx.loadingChapter}
            </p>
          ) : compareMode ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <p className={`mb-3 text-xs font-extrabold uppercase tracking-widest ${T.heading}`}>{primaryVersion}</p>
                <div className="space-y-3">
                  {primaryVerses.map((item) => (
                    <p key={`p-${item.verse}`} className="text-sm leading-8 text-white">
                      <span className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${T.verseBadge}`}>{item.verse}</span>
                      {item.text}
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <p className={`mb-3 text-xs font-extrabold uppercase tracking-widest ${T.heading}`}>{secondaryVersion}</p>
                <div className="space-y-3">
                  {secondaryVerses.map((item) => (
                    <p key={`s-${item.verse}`} className="text-sm leading-8 text-white">
                      <span className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${T.verseBadgeCompare}`}>{item.verse}</span>
                      {item.text}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : primaryVerses.length === 0 ? (
            <p className={`text-sm ${T.muted}`}>{tx.startMsg}</p>
          ) : (
            <div className="space-y-3">
              {primaryVerses.map((item) => (
                <p key={`v-${item.verse}`} className="text-[15px] leading-8 text-white">
                  <span className={`mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold ${T.verseBadge}`}>{item.verse}</span>
                  {item.text}
                </p>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function BibliaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900">
          <p className="inline-flex items-center gap-2 text-sm text-emerald-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparando lector bíblico...
          </p>
        </div>
      }
    >
      <BibliaClientPage />
    </Suspense>
  );
}
