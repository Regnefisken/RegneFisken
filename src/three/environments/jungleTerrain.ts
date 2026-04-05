/** Delt jungleø-terræn: samme kurve i `JungleIsland` og `JunglePlayerController`. */

export const ISLAND_Z = 14;
export const ISLAND_LIFT = 0.12;

export const SHORE_R = 27.5;
export const SAND_R = 22.0;
export const FOREST_R = 16.0;
export const HILL_R = 11.0;

export const SHORE_Y = -0.02;
export const SAND_Y = 0.15;
export const FOREST_Y = 0.65;
export const HILL_FOOT_Y = 0.65;

/** Bakketop i centrum (lokal Y før `ISLAND_LIFT`). */
export const HILL_TOP_Y = 0.9;

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Afstand fra øens xz-centrum (0, ISLAND_Z); glat højdekurve. */
export function terrainYAt(x: number, z: number, hillTopY: number): number {
  const d = Math.hypot(x, z - ISLAND_Z);
  if (d >= SHORE_R) return SHORE_Y;
  if (d >= SAND_R) {
    return SHORE_Y + (SAND_Y - SHORE_Y) * smoothstep(SHORE_R, SAND_R, d);
  }
  if (d >= FOREST_R) {
    return SAND_Y + (FOREST_Y - SAND_Y) * smoothstep(SAND_R, FOREST_R, d);
  }
  if (d >= HILL_R) {
    return FOREST_Y + (HILL_FOOT_Y - FOREST_Y) * smoothstep(FOREST_R, HILL_R, d);
  }
  return HILL_FOOT_Y + (hillTopY - HILL_FOOT_Y) * smoothstep(HILL_R, 0, d);
}

/** NPC / fod — samme som `terrainYAt` nu overfladen er glat. */
export function terrainSurfaceYAt(x: number, z: number, hillTopY: number): number {
  return terrainYAt(x, z, hillTopY);
}

function lerpColor(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Vertex-farve ud fra afstand til centrum (0–1 RGB). Sand lidt lysere end skov så stranden læses tydeligt. */
export function terrainColorAtDistance(d: number): [number, number, number] {
  const sand: [number, number, number] = [0.769, 0.635, 0.396];
  const forest: [number, number, number] = [0.173, 0.22, 0.141];
  const hill: [number, number, number] = [0.29, 0.227, 0.157];

  if (d >= SAND_R) return sand;
  if (d >= FOREST_R) {
    const t = smoothstep(SAND_R, FOREST_R, d);
    return lerpColor(sand, forest, t);
  }
  if (d >= HILL_R) {
    const t = smoothstep(FOREST_R, HILL_R, d);
    return lerpColor(forest, hill, t);
  }
  return hill;
}
