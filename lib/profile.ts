import type { CitizenProfile } from "@/types";

export const PROFILE_STORAGE_KEY = "yojana_profile";

export const DEFAULT_PROFILE: CitizenProfile = {
  name: "Ramu",
  age: 45,
  gender: "Male",
  state: "Maharashtra",
  occupation: "farmer",
  income: 80000,
  category: "sc",
  bpl: true,
  has_land: true,
  disabled: false,
};

function isProfileShape(data: unknown): data is CitizenProfile {
  if (!data || typeof data !== "object") return false;
  const p = data as CitizenProfile;
  return (
    typeof p.name === "string" &&
    typeof p.age === "number" &&
    typeof p.gender === "string" &&
    typeof p.state === "string" &&
    typeof p.occupation === "string" &&
    typeof p.income === "number" &&
    typeof p.category === "string" &&
    typeof p.bpl === "boolean" &&
    typeof p.has_land === "boolean" &&
    typeof p.disabled === "boolean"
  );
}

export function loadProfile(): CitizenProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isProfileShape(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: CitizenProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_STORAGE_KEY);
}
