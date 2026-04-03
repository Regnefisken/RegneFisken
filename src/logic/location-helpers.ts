/** Alle rum i fiskehytten (samme unlock: magnet + cabin_key). */
export const CABIN_LOCATIONS = ['cabin_living', 'cabin_kitchen', 'cabin_bedroom'] as const;
export type CabinLocationId = (typeof CABIN_LOCATIONS)[number];

export function isCabinLocation(locationId: string): boolean {
  return (CABIN_LOCATIONS as readonly string[]).includes(locationId);
}
