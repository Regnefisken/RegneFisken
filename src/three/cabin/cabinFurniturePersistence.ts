import type { Object3D } from 'three';
import { usePlayerStore } from '../../store/usePlayerStore.js';

const Y_DEFAULTS: Record<string, number> = {
  turtle: 0.19,
  axolotl: 1.33,
  aquarium: -0.2,
  table_vase: 1.215,
  rod_wall: 2.091,
  rug: 0,
  cheese: 0.08,
  golden_frog: 0,
  mounted_fish: 2.0,
  kitchen_table: 0,
  kitchen_stove: 0,
  kitchen_sink: 0,
  gulvplante: 0,
  kitchen_shelf: 2.2,
  kitchen_rug: 0.005,
  kitchen_lamp: 3.8,
  kitchen_telescope: 0,
  bedroom_bed: 0,
  bedroom_nightstand: 0,
  /* Natbords top ~1.08 (efter 2× skala); lampefod bund ~0.004 over gruppe-origin → 1.08 − 0.004 */
  bedroom_lamp: 1.076,
  bedroom_dresser: 0,
  bedroom_rug: 0.005,
  bedroom_frame: 2.0,
  bedroom_mirror: 0,
  bedroom_wardrobe: 0,
};

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

export const FURNITURE_RESET_DEFAULTS: Record<
  string,
  { x: number; z: number; rot: number }
> = {
  fireplace: { x: -3.6, z: -4.5, rot: 0 },
  table: { x: 0.22, z: -1.0, rot: 0 },
  rug: { x: 0.3, z: -1.0, rot: 0 },
  chair: { x: 1.34, z: -1.0, rot: (3 * Math.PI) / 2 },
  aquarium: { x: 4.15, z: -4.2, rot: 0 },
  shelf: { x: 5.4, z: 1.5, rot: -Math.PI / 2 },
  rod_wall: { x: 5.4, z: -1.3, rot: -Math.PI / 2 },
  turtle: { x: -1.92, z: -1.48, rot: -Math.PI * 0.15 },
  axolotl: { x: 1.0, z: -1.0, rot: Math.PI / 3 },
  table_vase: { x: 0.22, z: -1.0, rot: 0 },
  cheese: { x: -2.65, z: 1.95, rot: 0 },
  golden_frog: { x: 5.13, z: 0.21, rot: -2.4 },
  mounted_fish: { x: -5.35, z: -2.0, rot: Math.PI / 2 },
  kitchen_table: { x: 0, z: -4.0, rot: 0 },
  kitchen_stove: { x: -2.0, z: -4.0, rot: 0 },
  kitchen_sink: { x: 2.0, z: -4.0, rot: 0 },
  gulvplante: { x: 0, z: -1.5, rot: Math.PI },
  kitchen_shelf: { x: 4.5, z: -2.0, rot: -Math.PI / 2 },
  kitchen_rug: { x: 0, z: 0, rot: 0 },
  kitchen_lamp: { x: 0, z: -1.0, rot: 0 },
  kitchen_telescope: { x: 0, z: -3.8, rot: 0 },
  bedroom_bed: { x: -2.5, z: -2.5, rot: 0 },
  bedroom_nightstand: { x: -4.2, z: -2.5, rot: 0 },
  bedroom_lamp: { x: -4.2, z: -2.5, rot: 0 },
  bedroom_dresser: { x: 4.0, z: -3.0, rot: -Math.PI / 2 },
  bedroom_rug: { x: -2.5, z: -0.5, rot: 0 },
  bedroom_frame: { x: -5.4, z: -2.0, rot: Math.PI / 2 },
  bedroom_mirror: { x: 4.0, z: -1.0, rot: -Math.PI / 2 },
  bedroom_wardrobe: { x: 2.0, z: -4.5, rot: 0 },
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
