/** Alle rum i fiskehytten (samme unlock: magnet + cabin_key). */
export const CABIN_LOCATIONS = ['cabin_living', 'cabin_kitchen', 'cabin_bedroom'] as const;
export type CabinLocationId = (typeof CABIN_LOCATIONS)[number];

/** Lokationer uden hav-/vind-loop (startAmbience) — kun grotte. */
export const NO_OCEAN_AMBIENCE_LOCATIONS = new Set<string>(['cave']);

/** Hav-/vind-loop dæmpet vs. kyst/pier (hytten, Ørkensøen, legacy fishing_cabin). */
export const QUIET_OCEAN_AMBIENCE_MULTIPLIER = 0.28;

const QUIET_OCEAN_AMBIENCE_LOCATIONS = new Set<string>([
  ...CABIN_LOCATIONS,
  'cabin_cellar',
  'desert_lake',
  'fishing_cabin',
]);

export function shouldPlayOceanAmbience(locationId: string): boolean {
  return !NO_OCEAN_AMBIENCE_LOCATIONS.has(locationId);
}

export function getOceanAmbienceGainMultiplier(locationId: string): number {
  return QUIET_OCEAN_AMBIENCE_LOCATIONS.has(locationId) ? QUIET_OCEAN_AMBIENCE_MULTIPLIER : 1;
}

export function isCabinLocation(locationId: string): boolean {
  return (CABIN_LOCATIONS as readonly string[]).includes(locationId);
}
