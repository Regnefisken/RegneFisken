/** Alle rum i fiskehytten (samme unlock: magnet + cabin_key). */
export const CABIN_LOCATIONS = ['cabin_living', 'cabin_kitchen', 'cabin_bedroom'] as const;
export type CabinLocationId = (typeof CABIN_LOCATIONS)[number];

/** Lokationer uden hav-/vind-loop (startAmbience) — støjende/indendørs/ørken. */
export const NO_OCEAN_AMBIENCE_LOCATIONS = new Set<string>([
  ...CABIN_LOCATIONS,
  'cave',
  'desert_lake',
  /** Legacy persisted id — mappes ofte til `cabin_living`, men skal ikke have hav hvis den stadig findes. */
  'fishing_cabin',
]);

export function shouldPlayOceanAmbience(locationId: string): boolean {
  return !NO_OCEAN_AMBIENCE_LOCATIONS.has(locationId);
}

export function isCabinLocation(locationId: string): boolean {
  return (CABIN_LOCATIONS as readonly string[]).includes(locationId);
}
