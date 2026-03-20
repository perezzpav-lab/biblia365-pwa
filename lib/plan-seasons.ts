export type PlanSeason = {
  id: number;
  title: string;
  subtitle: string;
  startDay: number;
  endDay: number;
};

const TITLES = [
  { title: "Temporada 1", subtitle: "Orígenes y Creación" },
  { title: "Temporada 2", subtitle: "Pactos y Patriarcas" },
  { title: "Temporada 3", subtitle: "Éxodo y Ley" },
  { title: "Temporada 4", subtitle: "Conquista y Reino" },
  { title: "Temporada 5", subtitle: "Sabiduría y Adoración" },
  { title: "Temporada 6", subtitle: "Profetas y Llamado" },
  { title: "Temporada 7", subtitle: "Esperanza y Restauración" },
  { title: "Temporada 8", subtitle: "Vida de Jesús (I)" },
  { title: "Temporada 9", subtitle: "Vida de Jesús (II)" },
  { title: "Temporada 10", subtitle: "Iglesia Naciente" },
  { title: "Temporada 11", subtitle: "Cartas y Formación" },
  { title: "Temporada 12", subtitle: "Perseverancia y Gloria" },
];

export function buildPlanSeasons(totalDays: number): PlanSeason[] {
  const chunk = Math.ceil(totalDays / 12);
  return TITLES.map((season, index) => {
    const startDay = index * chunk + 1;
    const endDay = Math.min(totalDays, (index + 1) * chunk);
    return {
      id: index + 1,
      title: season.title,
      subtitle: season.subtitle,
      startDay,
      endDay,
    };
  });
}

export function getSeasonByDay(day: number, totalDays: number): PlanSeason {
  const seasons = buildPlanSeasons(totalDays);
  return (
    seasons.find((season) => day >= season.startDay && day <= season.endDay) ??
    seasons[seasons.length - 1]
  );
}
