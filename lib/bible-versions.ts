/** Versiones almacenadas en `bible_text` (sube JSON con `npm run seed:bible` o tu pipeline). */
export const DB_BIBLE_VERSIONS = ["RV1909", "NVI", "TLA", "RVR1960", "PDT"] as const;
export type DbBibleVersion = (typeof DB_BIBLE_VERSIONS)[number];

/** NET (New English Translation) completa vía API pública labs.bible.org (inglés). */
export const ONLINE_BIBLE_VERSION = "NET" as const;

export type BibleVersion = DbBibleVersion | typeof ONLINE_BIBLE_VERSION;

export const ALL_READER_VERSIONS: BibleVersion[] = [...DB_BIBLE_VERSIONS, ONLINE_BIBLE_VERSION];

export const VERSION_LABELS: Record<BibleVersion, string> = {
  RV1909: "Reina-Valera 1909",
  NVI: "NVI (requiere datos en Supabase)",
  TLA: "Traducción en lenguaje actual",
  RVR1960: "Reina-Valera 1960 (requiere JSON)",
  PDT: "Palabra de Dios para Todos (requiere JSON)",
  NET: "NET — inglés, completa en línea",
};

export function isOnlineNetVersion(v: BibleVersion): boolean {
  return v === ONLINE_BIBLE_VERSION;
}

/** Solo versiones con texto en tu base (búsqueda / comparar sin red). */
export const SEARCHABLE_DB_VERSIONS: DbBibleVersion[] = [...DB_BIBLE_VERSIONS];
