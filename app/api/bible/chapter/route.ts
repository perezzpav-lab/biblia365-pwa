import { NextRequest, NextResponse } from "next/server";
import { bookSpanishToLabsEnglish } from "@/lib/bible-canon";

export const dynamic = "force-dynamic";

type LabsRow = { bookname?: string; chapter?: string; verse?: string; text?: string };

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Proxy lectura NET completa (labs.bible.org). Solo versión NET para no abusar del servicio.
 */
export async function GET(req: NextRequest) {
  const version = req.nextUrl.searchParams.get("version");
  const book = req.nextUrl.searchParams.get("book");
  const chapter = req.nextUrl.searchParams.get("chapter");

  if (version !== "NET") {
    return NextResponse.json({ error: "Solo version=NET está soportada en esta ruta." }, { status: 400 });
  }
  if (!book || !chapter) {
    return NextResponse.json({ error: "Faltan book o chapter." }, { status: 400 });
  }

  const ch = Number(chapter);
  if (!Number.isFinite(ch) || ch < 1) {
    return NextResponse.json({ error: "Capítulo inválido." }, { status: 400 });
  }

  const english = bookSpanishToLabsEnglish(book);
  if (!english) {
    return NextResponse.json({ error: "Libro no reconocido." }, { status: 400 });
  }

  const passage = `${english} ${ch}`;
  const url = `https://labs.bible.org/api/?${new URLSearchParams({ passage, type: "json" }).toString()}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `labs.bible.org respondió ${res.status}` },
        { status: 502 },
      );
    }
    const raw = (await res.json()) as LabsRow[];
    if (!Array.isArray(raw)) {
      return NextResponse.json({ error: "Respuesta inesperada." }, { status: 502 });
    }

    const verses = raw
      .map((row) => ({
        verse: Number(row.verse ?? 0),
        text: stripTags(String(row.text ?? "")),
      }))
      .filter((v) => Number.isFinite(v.verse) && v.verse > 0 && v.text.length > 0)
      .sort((a, b) => a.verse - b.verse);

    return NextResponse.json({ verses, source: "labs.bible.org NET" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
