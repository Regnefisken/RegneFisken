import { getLocation } from '../../data/locations.js';

export function getWaterColorHex(locationId: string): number {
  return getLocation(locationId).waterColor;
}
