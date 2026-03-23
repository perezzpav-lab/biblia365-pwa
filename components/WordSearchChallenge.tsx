"use client";

import { motion } from "framer-motion";
import { SearchCheck } from "lucide-react";
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import type { ModoLectura } from "@/components/home/ModeSwitcher";

type Props = {
  mode: ModoLectura;
  onFinish: (result: { xp: number; perfect: boolean; correctAnswers: number }) => Promise<void> | void;
};

type Cell = {
  id: string;
  row: number;
  col: number;
  letter: string;
};

type Placement = {
  word: string;
  cellIds: string[];
  start: { row: number; col: number };
  end: { row: number; col: number };
};

type FoundLine = Placement & {
  color: string;
};

const GRID_SIZE = 10;
const LETTERS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚ";
const GRID_PADDING = 8;
const GRID_GAP = 4;
const FOUND_COLORS = ["#22c55e", "#f59e0b", "#0ea5e9", "#a855f7"];
const DIRECTIONS = [
  { dr: 0, dc: 1 },
  { dr: 0, dc: -1 },
  { dr: 1, dc: 0 },
  { dr: -1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: 1, dc: -1 },
  { dr: -1, dc: 1 },
  { dr: -1, dc: -1 },
];

const WORDS_BY_MODE: Record<ModoLectura, string[]> = {
  adulto: ["ABRAHAM", "ESTRELLAS", "ISAAC", "JACOB"],
  joven: ["PACTO", "GRACIA", "PROMESA", "ALTÍSIMO"],
  nino: ["JEHOVÁ", "PROMESA", "ALTÍSIMO", "ARCA"],
};

function randomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

function toCellId(row: number, col: number) {
  return `${row}-${col}`;
}

function sameCellSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  for (const id of b) {
    if (!setA.has(id)) return false;
  }
  return true;
}

function createGrid(words: string[]) {
  const matrix = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => ""));
  const placements: Placement[] = [];

  words.forEach((word) => {
    const clean = word.toUpperCase();
    let placed = false;

    for (let tries = 0; tries < 120 && !placed; tries += 1) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const endRow = row + direction.dr * (clean.length - 1);
      const endCol = col + direction.dc * (clean.length - 1);
      if (endRow < 0 || endRow >= GRID_SIZE || endCol < 0 || endCol >= GRID_SIZE) continue;

      let fits = true;
      for (let i = 0; i < clean.length; i += 1) {
        const r = row + direction.dr * i;
        const c = col + direction.dc * i;
        const current = matrix[r][c];
        if (current !== "" && current !== clean[i]) {
          fits = false;
          break;
        }
      }
      if (!fits) continue;

      const cellIds: string[] = [];
      for (let i = 0; i < clean.length; i += 1) {
        const r = row + direction.dr * i;
        const c = col + direction.dc * i;
        matrix[r][c] = clean[i];
        cellIds.push(toCellId(r, c));
      }
      placements.push({
        word: clean,
        cellIds,
        start: { row, col },
        end: { row: endRow, col: endCol },
      });
      placed = true;
    }

    if (!placed) {
      const row = words.indexOf(word) % GRID_SIZE;
      const col = 0;
      const cellIds: string[] = [];
      for (let i = 0; i < clean.length && col + i < GRID_SIZE; i += 1) {
        matrix[row][col + i] = clean[i];
        cellIds.push(toCellId(row, col + i));
      }
      placements.push({
        word: clean,
        cellIds,
        start: { row, col },
        end: { row, col: Math.min(GRID_SIZE - 1, col + clean.length - 1) },
      });
    }
  });

  const cells: Cell[] = [];
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      cells.push({ id: `${r}-${c}`, row: r, col: c, letter: matrix[r][c] || randomLetter() });
    }
  }
  return { cells, placements };
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(pattern);
}

export default function WordSearchChallenge({ mode, onFinish }: Props) {
  const words = useMemo(() => WORDS_BY_MODE[mode], [mode]);
  const { cells, placements } = useMemo(() => createGrid(words), [words]);
  const cellById = useMemo(() => new Map(cells.map((c) => [c.id, c])), [cells]);
  const [dragStart, setDragStart] = useState<Cell | null>(null);
  const [dragEnd, setDragEnd] = useState<Cell | null>(null);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundLines, setFoundLines] = useState<FoundLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);

  const foundCellIds = useMemo(() => new Set(foundLines.flatMap((line) => line.cellIds)), [foundLines]);
  const cellSize = useMemo(() => {
    if (gridWidth === 0) return 0;
    return (gridWidth - GRID_PADDING * 2 - GRID_GAP * (GRID_SIZE - 1)) / GRID_SIZE;
  }, [gridWidth]);

  const activeSelection = useMemo(() => {
    if (!dragStart || !dragEnd) return [];
    const drRaw = dragEnd.row - dragStart.row;
    const dcRaw = dragEnd.col - dragStart.col;
    const dr = drRaw === 0 ? 0 : drRaw > 0 ? 1 : -1;
    const dc = dcRaw === 0 ? 0 : dcRaw > 0 ? 1 : -1;
    if (dr === 0 && dc === 0) return [toCellId(dragStart.row, dragStart.col)];
    if (dr !== 0 && dc !== 0 && Math.abs(drRaw) !== Math.abs(dcRaw)) return [];
    const steps = Math.max(Math.abs(drRaw), Math.abs(dcRaw));
    const ids: string[] = [];
    for (let i = 0; i <= steps; i += 1) {
      ids.push(toCellId(dragStart.row + dr * i, dragStart.col + dc * i));
    }
    return ids;
  }, [dragStart, dragEnd]);

  const resolveCellAtPoint = useCallback(
    (clientX: number, clientY: number): Cell | null => {
      if (typeof document === "undefined") return null;
      const el = document.elementFromPoint(clientX, clientY);
      const target = el?.closest?.("[data-wordsearch-cell]");
      const id = target?.getAttribute("data-wordsearch-cell");
      if (!id) return null;
      return cellById.get(id) ?? null;
    },
    [cellById],
  );

  const checkSelection = async () => {
    if (activeSelection.length === 0 || !dragStart || !dragEnd) {
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const matched = placements.find((placement) => sameCellSet(placement.cellIds, activeSelection));
    if (matched && !foundWords.includes(matched.word)) {
      const completesAll = foundWords.length + 1 === words.length;
      setFoundWords((prev) => [...prev, matched.word]);
      setFoundLines((prev) => [
        ...prev,
        {
          ...matched,
          color: FOUND_COLORS[prev.length % FOUND_COLORS.length],
        },
      ]);
      vibrate(100);
      if (completesAll) {
        window.setTimeout(() => vibrate([100, 50, 100, 50, 200]), 170);
      }
    }
    setDragStart(null);
    setDragEnd(null);
  };

  const onGridPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const cell = resolveCellAtPoint(e.clientX, e.clientY);
    if (!cell) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    vibrate(50);
    setDragStart(cell);
    setDragEnd(cell);
  };

  const onGridPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const cell = resolveCellAtPoint(e.clientX, e.clientY);
    if (cell) setDragEnd(cell);
  };

  const onGridPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    void checkSelection();
  };

  const onGridPointerCancel = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragStart(null);
    setDragEnd(null);
  };

  const syncGridWidth = (node: HTMLDivElement | null) => {
    if (!node) return;
    setGridWidth(node.clientWidth);
  };

  const finishGame = async () => {
    setSaving(true);
    await onFinish({
      xp: 30,
      perfect: true,
      correctAnswers: words.length,
    });
    setSaving(false);
    setDone(true);
  };

  const allFound = foundWords.length === words.length;

  const lineStyle = (start: { row: number; col: number }, end: { row: number; col: number }, color: string) => {
    if (cellSize <= 0) return {};
    const x1 = GRID_PADDING + start.col * (cellSize + GRID_GAP) + cellSize / 2;
    const y1 = GRID_PADDING + start.row * (cellSize + GRID_GAP) + cellSize / 2;
    const x2 = GRID_PADDING + end.col * (cellSize + GRID_GAP) + cellSize / 2;
    const y2 = GRID_PADDING + end.row * (cellSize + GRID_GAP) + cellSize / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return {
      left: `${x1}px`,
      top: `${y1}px`,
      width: `${length + cellSize * 0.55}px`,
      height: `${Math.max(12, cellSize * 0.42)}px`,
      transform: `translateY(-50%) rotate(${angle}deg)`,
      transformOrigin: "left center",
      background: color,
    } as const;
  };

  const activeLine =
    dragStart && dragEnd
      ? {
          start: { row: dragStart.row, col: dragStart.col },
          end: { row: dragEnd.row, col: dragEnd.col },
        }
      : null;

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-lg">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <SearchCheck className="h-4 w-4 text-emerald-700" />
        Juego 6: Sopa de Letras Bíblica
      </p>
      <p className="mt-1 text-xs text-zinc-600">Arrastra sobre letras para formar las palabras.</p>

      <div
        ref={syncGridWidth}
        className="relative mt-3 grid select-none gap-1 rounded-2xl bg-zinc-100 p-2"
        role="application"
        aria-label="Sopa de letras: arrastra en diagonal, horizontal o vertical"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`, touchAction: "none" }}
        onPointerDown={onGridPointerDown}
        onPointerMove={onGridPointerMove}
        onPointerUp={onGridPointerUp}
        onPointerCancel={onGridPointerCancel}
        onPointerLeave={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) return;
          void checkSelection();
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          {foundLines.map((line) => (
            <motion.div
              key={`${line.word}-${line.start.row}-${line.start.col}`}
              className="absolute rounded-full"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{
                opacity: [0.68, 0.96, 0.7],
                scale: [1, 1.03, 1],
                boxShadow: [
                  "0 0 10px rgba(255,255,255,0.35)",
                  "0 0 22px rgba(255,255,255,0.75)",
                  "0 0 14px rgba(255,255,255,0.45)",
                ],
              }}
              transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              style={lineStyle(line.start, line.end, line.color)}
            />
          ))}
          {activeLine && (
            <div
              className="absolute rounded-full bg-amber-400/55 shadow-[0_0_10px_rgba(245,158,11,0.45)]"
              style={lineStyle(activeLine.start, activeLine.end, "rgba(251,191,36,0.55)")}
            />
          )}
        </div>
        {cells.map((cell) => {
          const selected = activeSelection.includes(cell.id);
          const found = foundCellIds.has(cell.id);
          return (
            <button
              key={cell.id}
              type="button"
              data-wordsearch-cell={cell.id}
              tabIndex={-1}
              className={`relative z-10 aspect-square rounded-md text-center text-xs font-bold sm:text-sm ${
                found
                  ? "bg-emerald-200 text-emerald-900"
                  : selected
                    ? "bg-amber-200 text-amber-900"
                    : "bg-white text-zinc-800"
              }`}
            >
              {cell.letter}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {words.map((word) => {
          const found = foundWords.includes(word);
          return (
            <span
              key={word}
              className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                found ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-zinc-300 bg-white text-zinc-600"
              }`}
            >
              {word}
            </span>
          );
        })}
      </div>

      {allFound && !done && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <p className="text-sm font-semibold text-emerald-700">¡Encontraste todas! +30 XP</p>
          <button
            type="button"
            onClick={() => void finishGame()}
            disabled={saving}
            className="mt-2 w-full rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
          >
            {saving ? "Guardando..." : "Guardar resultado"}
          </button>
        </motion.div>
      )}

      {done && <p className="mt-3 text-sm font-semibold text-emerald-700">Resultado guardado. ¡Excelente trabajo!</p>}
    </section>
  );
}
