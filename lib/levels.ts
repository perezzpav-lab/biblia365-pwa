export type LevelInfo = {
  level: number;
  title: "Sembrador" | "Guerrero" | "Anciano";
  currentXp: number;
  nextLevelXp: number;
  progressPercent: number;
};

const XP_PER_LEVEL = 100;

export function getLevelFromXp(xp: number): LevelInfo {
  const safeXp = Math.max(0, xp);
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const title = level >= 50 ? "Anciano" : level >= 10 ? "Guerrero" : "Sembrador";
  const baseXp = (level - 1) * XP_PER_LEVEL;
  const nextLevelXp = level * XP_PER_LEVEL;
  const progressPercent = Math.min(100, ((safeXp - baseXp) / XP_PER_LEVEL) * 100);

  return {
    level,
    title,
    currentXp: safeXp,
    nextLevelXp,
    progressPercent,
  };
}
