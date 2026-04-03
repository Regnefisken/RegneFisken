import type { RoomId } from '../data/furnitureShopItems.js';
import { getCurrentRoom } from '../data/furnitureShopItems.js';

/** Købte shop-møbler: synlige i rum når købt, placeret i rum, ikke skjult. */
export function isShopFurnitureVisibleInRoom(
  type: string,
  roomId: RoomId,
  unlockedFurniture: string[],
  furnitureRoomAssignment: Record<string, RoomId>,
  hiddenFurniture: string[],
): boolean {
  if (!unlockedFurniture.includes(type)) return false;
  if (hiddenFurniture.includes(type)) return false;
  return getCurrentRoom(type, furnitureRoomAssignment) === roomId;
}

/** Quest-kompagnoner: synlige når tilgængelige og ikke skjulte. */
export function isCompanionVisibleInRoom(
  type: string,
  roomId: RoomId,
  available: boolean,
  furnitureRoomAssignment: Record<string, RoomId>,
  hiddenFurniture: string[],
): boolean {
  if (!available) return false;
  if (hiddenFurniture.includes(type)) return false;
  return getCurrentRoom(type, furnitureRoomAssignment) === roomId;
}
