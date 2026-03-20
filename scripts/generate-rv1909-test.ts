import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type Verse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

const SOURCE_SQL_URL =
  "https://raw.githubusercontent.com/iglesianazaret/biblia-reina-valera-1909-base-datos-sql/master/data.sql";

const BOOK_ID_TO_NAME: Record<number, string> = {
  1: "Génesis",
  40: "Mateo",
};

async function run() {
  console.log("⬇️ Descargando fuente RV1909...");
  const response = await fetch(SOURCE_SQL_URL);
  if (!response.ok) {
    throw new Error(`No se pudo descargar data.sql (${response.status})`);
  }
  const sql = await response.text();

  console.log("🔎 Extrayendo Génesis y Mateo...");
  const regex = /\((\d+),\s*(\d+),\s*(\d+),\s*'((?:\\'|[^'])*)'\)/g;
  const verses: Verse[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sql)) !== null) {
    const bookId = Number(match[1]);
    if (!(bookId in BOOK_ID_TO_NAME)) continue;

    verses.push({
      book: BOOK_ID_TO_NAME[bookId],
      chapter: Number(match[2]),
      verse: Number(match[3]),
      text: match[4].replace(/\\'/g, "'"),
    });
  }

  if (verses.length === 0) {
    throw new Error("No se encontraron versículos para Génesis/Mateo.");
  }

  const outDir = resolve("data", "bibles");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, "rv1909.json");

  writeFileSync(outPath, JSON.stringify(verses, null, 2), "utf8");
  const genesisCount = verses.filter((v) => v.book === "Génesis").length;
  const mateoCount = verses.filter((v) => v.book === "Mateo").length;

  console.log(`✅ Archivo generado: ${outPath}`);
  console.log(`📘 Génesis: ${genesisCount} versículos`);
  console.log(`📗 Mateo: ${mateoCount} versículos`);
  console.log(`📦 Total: ${verses.length} versículos`);
}

void run();
