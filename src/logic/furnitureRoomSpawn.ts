import type { RoomId } from '../data/furnitureShopItems.js';
import { getDefaultRoomForType } from '../data/furnitureShopItems.js';
import {
  FURNITURE_RESET_DEFAULTS,
  getFurnitureYDefaults,
} from '../three/cabin/cabinFurniturePersistence.js';

/** Spawn midt i rummet når møblet ikke er i sit default-rum og ikke har gemt position. */
export const ROOM_ENTRY_POSITIONS: Record<RoomId, { x: number; z: number; y: number }> = {
  living: { x: 0, z: 0, y: 0 },
  kitchen: { x: 0, z: -1.0, y: 0 },
  bedroom: { x: 0, z: -1.0, y: 0 },
};

export function getFurnitureSpawnTransform(
  type: string,
  roomId: RoomId,
  furniturePositions: Record<string, { x: number; y: number; z: number; rot?: number }>,
): { pos: [number, number, number]; rotY: number } {
  const saved = furniturePositions[type];
  if (saved) {
    return { pos: [saved.x, saved.y, saved.z], rotY: saved.rot ?? 0 };
  }
  const yMap = getFurnitureYDefaults() as Record<string, number>;
  const defRoom = getDefaultRoomForType(type);
  if (roomId === defRoom) {
    const d = FURNITURE_RESET_DEFAULTS[type];
    const yDef = yMap[type] ?? 0;
    if (d) return { pos: [d.x, yDef, d.z], rotY: d.rot };
    return { pos: [0, yDef, 0], rotY: 0 };
  }
  const entry = ROOM_ENTRY_POSITIONS[roomId];
  const yDef = yMap[type] ?? 0;
  const y = yDef !== 0 ? yDef : entry.y;
  return { pos: [entry.x, y, entry.z], rotY: 0 };
}
