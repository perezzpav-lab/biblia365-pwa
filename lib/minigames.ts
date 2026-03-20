export type MiniGameType = "trivia";

export type MiniGameDefinition = {
  id: string;
  type: MiniGameType;
  title: string;
  description: string;
  cta: string;
};

const MINIGAMES: MiniGameDefinition[] = [
  {
    id: "trivia-diaria",
    type: "trivia",
    title: "Minijuego del día",
    description: "Responde la trivia bíblica y gana puntos de fidelidad.",
    cta: "Jugar trivia",
  },
];

export function getDailyMiniGame(dayOfYear: number): MiniGameDefinition {
  const index = dayOfYear % MINIGAMES.length;
  return MINIGAMES[index];
}
