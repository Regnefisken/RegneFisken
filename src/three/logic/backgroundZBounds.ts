/** Legacy `BACKGROUND_Z_BOUNDS` — skyer og fugle holdes uden for rum/indendørs scener. */
export const BACKGROUND_Z_BOUNDS: Record<
  string,
  { minZ: number; maxZ: number; disabled?: boolean }
> = {
  pier: { minZ: -48, maxZ: -9 },
  cabin_living: { minZ: -25, maxZ: -7 },
  cabin_kitchen: { minZ: -25, maxZ: -7 },
  /** Ingen fugle/skyer (soveværelse har tonet glas, ikke udsyn til scene). */
  cabin_bedroom: { minZ: -25, maxZ: -7, disabled: true },
  cave: { minZ: -55, maxZ: -55, disabled: true },
  tropical_island: { minZ: -48, maxZ: -9 },
  smaragd: { minZ: -48, maxZ: -9 },
  abyss: { minZ: -48, maxZ: -9 },
  desert_lake: { minZ: -48, maxZ: -9 },
  arctic_sea: { minZ: -48, maxZ: -9 },
  forbidden: { minZ: -48, maxZ: -9 },
  jungle_island: { minZ: -48, maxZ: -9 },
};

export function getBackgroundZBounds(locationId: string) {
  return BACKGROUND_Z_BOUNDS[locationId] ?? BACKGROUND_Z_BOUNDS.pier;
}
