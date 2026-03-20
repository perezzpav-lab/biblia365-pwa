export type ParsedReference = {
  book: string;
  chapter: number;
};

const BOOK_PATTERN =
  /((?:\d\s*)?[A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+)*)\s+(\d+)(?::\d+)?/;

export function parseBibleReference(input: string): ParsedReference | null {
  const match = input.match(BOOK_PATTERN);
  if (!match) return null;
  const book = match[1].trim().replace(/\s+/g, " ");
  const chapter = Number(match[2]);
  if (!book || Number.isNaN(chapter) || chapter < 1) return null;
  return { book, chapter };
}

export function formatBibleRoute(input: string): string | null {
  const parsed = parseBibleReference(input);
  if (!parsed) return null;
  const params = new URLSearchParams({
    book: parsed.book,
    chapter: String(parsed.chapter),
  });
  return `/biblia?${params.toString()}`;
}
