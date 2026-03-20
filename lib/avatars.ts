export type AvatarOption = {
  key: string;
  label: string;
  emoji: string;
};

export const AVATAR_OPTIONS: AvatarOption[] = [
  { key: "lion_shield", label: "Escudo León", emoji: "🛡️" },
  { key: "dove_shield", label: "Escudo Paloma", emoji: "🕊️" },
  { key: "eagle_shield", label: "Escudo Águila", emoji: "🦅" },
  { key: "lamb", label: "Corderito", emoji: "🐑" },
  { key: "deer", label: "Ciervo", emoji: "🦌" },
  { key: "fish", label: "Pez", emoji: "🐟" },
];

export function getAvatarByKey(key: string | null | undefined): AvatarOption {
  const found = AVATAR_OPTIONS.find((item) => item.key === key);
  return found ?? AVATAR_OPTIONS[0];
}
