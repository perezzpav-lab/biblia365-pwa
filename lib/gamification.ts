export type BadgeId = "semana_fiel" | "mes_constante" | "primer_libro";

export type BadgeDefinition = {
  id: BadgeId;
  title: string;
  description: string;
  unlocked: (context: { completedDays: number; booksCompleted: number }) => boolean;
};

export const BADGES: BadgeDefinition[] = [
  {
    id: "semana_fiel",
    title: "7 días de fidelidad",
    description: "Completaste tu primera semana continua en la Palabra.",
    unlocked: ({ completedDays }) => completedDays >= 7,
  },
  {
    id: "mes_constante",
    title: "30 días de constancia",
    description: "Tu hábito espiritual ya es una disciplina firme.",
    unlocked: ({ completedDays }) => completedDays >= 30,
  },
  {
    id: "primer_libro",
    title: "Primer libro completado",
    description: "Terminaste el primer gran bloque de lectura bíblica.",
    unlocked: ({ booksCompleted }) => booksCompleted >= 1,
  },
];

export function estimateBooksCompleted(completedDays: number): number {
  // Escalable: reemplazar por progreso real por libro cuando exista esa data.
  return Math.floor(completedDays / 50);
}

export function getCurrentStreak(
  completedDays: number[],
  todayDayOfYear: number,
): number {
  const set = new Set(completedDays);

  if (!set.has(todayDayOfYear) && !set.has(todayDayOfYear - 1)) {
    return 0;
  }

  let cursor = set.has(todayDayOfYear) ? todayDayOfYear : todayDayOfYear - 1;
  let streak = 0;

  while (cursor > 0 && set.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }

  return streak;
}

export function getWeeklyMissionProgress(completedDays: number[], todayDayOfYear: number): {
  completed: number;
  goal: number;
} {
  const goal = 5;
  const start = Math.max(1, todayDayOfYear - 6);
  const completed = completedDays.filter((day) => day >= start && day <= todayDayOfYear).length;
  return { completed, goal };
}
