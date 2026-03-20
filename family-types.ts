export type FamilyProfileRole = "admin" | "member" | "child";

export type FamilyProfile = {
  id: string;
  name: string;
  emoji: string;
  role: FamilyProfileRole;
};

export const FAMILY_PROFILES_KEY = "biblia365_family_profiles";
export const FAMILY_NAME_KEY = "biblia365_family_name";
export const FAMILY_SELECTED_PROFILE_KEY = "biblia365_selected_profile";

/** Un solo perfil por defecto hasta que el usuario configure su familia en onboarding */
export function createDefaultFamilyProfiles(): FamilyProfile[] {
  return [
    {
      id: "primary",
      name: "Principal",
      emoji: "📖",
      role: "admin",
    },
  ];
}

function randomIdSuffix(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

export function slugifyProfileId(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  return base || `perfil_${randomIdSuffix()}`;
}
