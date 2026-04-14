import type { Object3D } from 'three';
import { usePlayerStore } from '../../store/usePlayerStore.js';

const Y_DEFAULTS: Record<string, number> = {
  turtle: 0.19,
  /** Lidt over gulv — stadig lavt, ikke bordhøjde. */
  axolotl: 0.19,
  aquarium: -0.2,
  table_vase: 1.215,
  rod_wall: 2.091,
  rug: 0,
  cheese: 0.08,
  golden_frog: 0,
  pirate_chest: 0,
  ice_cube: 0,
  music_box: 0,
  pirate_cat: 0,
  ur_krystal: 0.59, // standard: +2× ↑ (0.12) fra 0.35
  mounted_fish: 2.0,
  /* Spiller-defaults (lav gulv / bordplade) */
  kitchen_table: -0.12,
  kitchen_stove: -0.1,
  kitchen_sink: 0.02,
  gulvplante: 0,
  kitchen_shelf: 2.2,
  kitchen_rug: 0.005,
  kitchen_lamp: 3.8,
  kitchen_telescope: 0,
  bedroom_bed: 0,
  bedroom_nightstand: 0,
  bedroom_lamp: 1.076,
  bedroom_dresser: 0,
  bedroom_rug: 0.005,
  bedroom_frame: 3.56,
  bedroom_mirror: 0,
  bedroom_wardrobe: 0,
};

/** Kun de møbler der er monteret i scenen (typisk ét rum). Brug sammen med merge ind i `furniturePositions`. */
export function snapshotFurniturePositions(movables: Object3D[]) {
  const positions: Record<string, { x: number; y: number; z: number; rot: number }> = {};
  for (const obj of movables) {
    const t = obj.userData?.movableType as string | undefined;
    if (t) {
      positions[t] = {
        x: obj.position.x,
        y: obj.position.y,
        z: obj.position.z,
        rot: obj.rotation.y,
      };
    }
  }
  return positions;
}

export function applyFurniturePositions(
  movables: Object3D[],
  positions: Record<string, { x?: number; y?: number; z?: number; rot?: number }>,
) {
  for (const obj of movables) {
    const t = obj.userData?.movableType as string | undefined;
    if (!t || !positions[t]) continue;
    const p = positions[t];
    obj.position.x = p.x ?? obj.position.x;
    obj.position.z = p.z ?? obj.position.z;
    obj.position.y = p.y !== undefined ? p.y : (Y_DEFAULTS[t] ?? 0);
    if (p.rot !== undefined) obj.rotation.y = p.rot;
  }
}

export function getFurnitureYDefaults(): Readonly<Record<string, number>> {
  return Y_DEFAULTS;
}

/** Standard x/z/rot ved «Nulstil møbler» — afstemt med spiller-layout (save v14). */
export const FURNITURE_RESET_DEFAULTS: Record<
  string,
  { x: number; z: number; rot: number }
> = {
  fireplace: { x: -3.6, z: -4.5, rot: 0 },
  table: { x: 0.2196, z: -1.062, rot: 0 },
  rug: { x: 0.3, z: -1.0, rot: 0 },
  chair: { x: 1.34, z: -1.0, rot: (3 * Math.PI) / 2 },
  aquarium: { x: 3.8313, z: -3.9818, rot: 0 },
  shelf: { x: 5.4, z: 1.5, rot: -Math.PI / 2 },
  rod_wall: { x: 5.4, z: -1.3, rot: -Math.PI / 2 },
  turtle: { x: -1.92, z: -1.48, rot: -Math.PI * 0.15 },
  axolotl: { x: 2.85, z: 1.12, rot: 2.35 },
  table_vase: { x: 0.22, z: -1.0, rot: 0 },
  cheese: { x: -2.7759, z: 1.3006, rot: 0 },
  golden_frog: { x: 4.7432, z: 0.2735, rot: -2.4 },
  pirate_chest: { x: 2.2, z: -2.2, rot: 0.35 },
  ice_cube: { x: -2.1, z: -3.6, rot: 0 },
  music_box: { x: -1.8, z: 0.4, rot: -0.25 },
  pirate_cat: { x: 1.2, z: 0.6, rot: 0.5 },
  ur_krystal: { x: 3.0, z: 1.5, rot: 0 },
  mounted_fish: { x: -5.4, z: -1.491, rot: Math.PI / 2 },
  kitchen_table: { x: 0, z: -4.0, rot: 0 },
  kitchen_stove: { x: -1.69, z: -3.883, rot: 0 },
  kitchen_sink: { x: 2.0, z: -4.0, rot: 0 },
  gulvplante: { x: -5.1446, z: -4.519, rot: Math.PI },
  kitchen_shelf: { x: 5.4, z: -1.4682, rot: -Math.PI / 2 },
  kitchen_rug: { x: -0.322, z: 1.0232, rot: 0 },
  kitchen_lamp: { x: 0, z: -1.0, rot: 0 },
  kitchen_telescope: { x: 3.533, z: -0.6885, rot: 0.3 },
  bedroom_bed: { x: -1.5913, z: -3.0027, rot: 0 },
  bedroom_nightstand: { x: -4.775, z: -4.4354, rot: 0 },
  bedroom_lamp: { x: -4.8242, z: -4.6, rot: 0 },
  bedroom_dresser: { x: -5.4, z: 1.3213, rot: -Math.PI / 2 },
  bedroom_rug: { x: -1.6619, z: 2.0056, rot: 0 },
  bedroom_frame: { x: -1.5874, z: -4.6, rot: 0.07079632679489645 },
  bedroom_mirror: { x: 4.2215, z: -1.8534, rot: -0.37079632679489644 },
  bedroom_wardrobe: { x: 2.2191, z: -4.6, rot: 0 },
};

export function resetFurnitureToDefaults(movables: Object3D[]) {
  const yDef = Y_DEFAULTS;
  for (const obj of movables) {
    const t = obj.userData?.movableType as string | undefined;
    const d = t ? FURNITURE_RESET_DEFAULTS[t] : undefined;
    if (!t || !d) continue;
    obj.position.set(d.x, yDef[t] ?? 0, d.z);
    obj.rotation.y = d.rot;
  }
  usePlayerStore.setState({ hiddenFurniture: [], furnitureRoomAssignment: {} });
}
