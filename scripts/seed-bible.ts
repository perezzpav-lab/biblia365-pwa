import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: resolve(".env.local") });
dotenv.config();

type BibleVersion = "RV1909" | "NVI" | "TLA" | "RVR1960" | "PDT";

type BibleRow = {
  version: BibleVersion;
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

type SourceConfig = {
  version: BibleVersion;
  source: string;
};

const CHUNK_SIZE = Number(process.env.BIBLE_SEED_CHUNK_SIZE ?? 1000);

const DEFAULT_SOURCES: SourceConfig[] = [
  { version: "RV1909", source: process.env.BIBLE_SOURCE_RV1909 ?? "data/bibles/rv1909.json" },
  { version: "NVI", source: process.env.BIBLE_SOURCE_NVI ?? "data/bibles/nvi.json" },
  { version: "TLA", source: process.env.BIBLE_SOURCE_TLA ?? "data/bibles/tla.json" },
  { version: "RVR1960", source: process.env.BIBLE_SOURCE_RVR1960 ?? "data/bibles/rvr1960.json" },
  { version: "PDT", source: process.env.BIBLE_SOURCE_PDT ?? "data/bibles/pdt.json" },
];

function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta variable de entorno requerida: ${name}`);
  return value;
}

function isHttp(input: string): boolean {
  return /^https?:\/\//i.test(input);
}

function normalizeText(input: unknown): string {
  return String(input ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadJson(source: string): Promise<unknown> {
  if (isHttp(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`No se pudo descargar JSON (${response.status}) desde ${source}`);
    }
    return response.json();
  }

  const fullPath = resolve(source);
  if (!existsSync(fullPath)) {
    throw new Error(`No existe archivo local: ${fullPath}`);
  }
  const raw = readFileSync(fullPath, "utf8");
  return JSON.parse(raw);
}

function parseFlatArray(data: unknown, version: BibleVersion): BibleRow[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const book = normalizeText(row.book ?? row.libro ?? row.book_name ?? row.nombre_libro);
      const chapter = Number(row.chapter ?? row.capitulo ?? row.chapter_number);
      const verse = Number(row.verse ?? row.versiculo ?? row.verse_number);
      const text = normalizeText(
        version === "TLA"
          ? row.story_mode ?? row.text ?? row.texto ?? row.content ?? row.verse_text
          : row.text ?? row.texto ?? row.content ?? row.verse_text,
      );
      if (!book || !Number.isFinite(chapter) || !Number.isFinite(verse) || !text) return null;
      return { version, book, chapter, verse, text } satisfies BibleRow;
    })
    .filter((row): row is BibleRow => row !== null);
}

function parseBooksArray(books: unknown, version: BibleVersion): BibleRow[] {
  if (!Array.isArray(books)) return [];
  const output: BibleRow[] = [];

  books.forEach((bookItem, bookIndex) => {
    if (typeof bookItem !== "object" || bookItem === null) return;
    const bookObj = bookItem as Record<string, unknown>;
    const bookName = normalizeText(
      bookObj.name ?? bookObj.book ?? bookObj.book_name ?? bookObj.libro ?? `Libro ${bookIndex + 1}`,
    );
    const chapters = Array.isArray(bookObj.chapters) ? bookObj.chapters : [];

    chapters.forEach((chapterItem, chapterIndex) => {
      const chapterNumber = chapterIndex + 1;
      if (Array.isArray(chapterItem)) {
        chapterItem.forEach((verseItem, verseIndex) => {
          if (typeof verseItem === "string") {
            output.push({
              version,
              book: bookName,
              chapter: chapterNumber,
              verse: verseIndex + 1,
              text: normalizeText(verseItem),
            });
            return;
          }
          if (typeof verseItem === "object" && verseItem !== null) {
            const verseObj = verseItem as Record<string, unknown>;
            const verseNumber = Number(verseObj.verse ?? verseObj.versiculo ?? verseIndex + 1);
            const verseText = normalizeText(
              verseObj.text ?? verseObj.texto ?? verseObj.content ?? verseObj.verse_text,
            );
            if (!Number.isFinite(verseNumber) || !verseText) return;
            output.push({
              version,
              book: bookName,
              chapter: chapterNumber,
              verse: verseNumber,
              text: verseText,
            });
          }
        });
      }
    });
  });

  return output.filter((row) => row.text.length > 0);
}

function extractRows(json: unknown, version: BibleVersion): BibleRow[] {
  const flat = parseFlatArray(json, version);
  if (flat.length > 0) return flat;

  if (typeof json === "object" && json !== null) {
    const container = json as Record<string, unknown>;
    const nested =
      parseBooksArray(container.books, version).length > 0
        ? parseBooksArray(container.books, version)
        : parseBooksArray(container.data, version);
    if (nested.length > 0) return nested;
  }

  return [];
}

async function seedVersion(rows: BibleRow[], version: BibleVersion) {
  const supabaseUrl = assertEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = assertEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  let inserted = 0;
  let lastBook = "";

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const firstBook = chunk[0]?.book ?? "";
    if (firstBook && firstBook !== lastBook) {
      lastBook = firstBook;
      console.log(`📘 Cargando ${firstBook} (${version})...`);
    }

    const { error } = await supabaseAdmin.from("bible_text").upsert(chunk, {
      onConflict: "version,book,chapter,verse",
      ignoreDuplicates: false,
    });
    if (error) {
      throw new Error(`Fallo insert/upsert en ${version} (chunk ${i / CHUNK_SIZE + 1}): ${error.message}`);
    }
    inserted += chunk.length;
    const percent = Math.min(100, Math.round((inserted / rows.length) * 100));
    console.log(`✅ ${version}: ${inserted}/${rows.length} versículos (${percent}%)`);
  }
}

async function run() {
  console.log("🚀 Iniciando seed de Biblia (RV1909, NVI, TLA, RVR1960, PDT)...");
  console.log(`📦 Tamaño de lote: ${CHUNK_SIZE}`);
  console.log(`📁 Ruta esperada RV1909: ${resolve(process.env.BIBLE_SOURCE_RV1909 ?? "data/bibles/rv1909.json")}`);

  for (const source of DEFAULT_SOURCES) {
    try {
      if (!isHttp(source.source)) {
        const fullPath = resolve(source.source);
        if (!existsSync(fullPath)) {
          console.log(`⚠️ ${source.version} no encontrada, saltando... (${fullPath})`);
          continue;
        }
      }

      console.log(`\n🔎 Fuente ${source.version}: ${source.source}`);
      const json = await loadJson(source.source);
      const rows = extractRows(json, source.version);
      if (rows.length === 0) {
        console.log(`⚠️ No se detectaron versículos para ${source.version}. Revisa el formato JSON.`);
        continue;
      }
      console.log(`🧾 ${source.version}: ${rows.length} versículos listos para insertar.`);
      await seedVersion(rows, source.version);
      console.log(`🏁 ${source.version} completado.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error en ${source.version}: ${message}`);
    }
  }

  console.log("\n🎉 Seed finalizado.");
}

void run();
