import type { BufferGeometry } from 'three';
import { getWeatherEntry } from './environment.js';
import { getLocation } from '../../data/locations.js';

/** Vertex displacement for vandplan — porteret fra legacy `tickScene`. */
export function updateWaterGeometry(
  waterGeo: BufferGeometry,
  time: number,
  locationId: string,
  weatherType: string,
): void {
  const pos = waterGeo.attributes.position;
  if (!pos) return;

  const wData = getWeatherEntry(locationId === 'cave' ? 'clear' : weatherType);
  const onTropicalIsland = locationId === 'tropical_island';
  const onDesertLake = locationId === 'desert_lake';
  const onArcticSea = locationId === 'arctic_sea';

  const ISLAND_VX = 0;
  const ISLAND_VY = -11.5;
  const ISLAND_R = 15.0;

  const DESERT_CENTER_X = 0;
  const DESERT_CENTER_Z = -7.0;
  const DESERT_RADIUS_X = 15.7;
  const DESERT_RADIUS_Z = 9.1;
  const DESERT_EDGE_START = 0.96;
  const DESERT_WATER_LEVEL = 0.11;
  const DESERT_RIPPLE_FACTOR = 0.12;
  const DESERT_DRY_DEPTH = -1.25;
  const BRIDGE_FRAME_MIN_X = -1.65;
  const BRIDGE_FRAME_MAX_X = 1.65;
  const BRIDGE_FRAME_MIN_Z = 0.05;
  const BRIDGE_FRAME_MAX_Z = 11.2;

  const ARCTIC_SEA_FRONT_Z = -0.9;
  const ARCTIC_SEA_BLEND = 2.1;
  const ARCTIC_DRY_DEPTH = -1.2;
  const ARCTIC_BRIDGE_MIN_X = -2.05;
  const ARCTIC_BRIDGE_MAX_X = 2.05;
  const ARCTIC_BRIDGE_MIN_Z = -1.2;
  const ARCTIC_BRIDGE_MAX_Z = 11.4;

  const amp = wData.waveAmp;
  const speed = wData.storm ? 2.5 : 1.0;

  for (let i = 0; i < pos.count; i++) {
    const wave =
      amp * Math.sin(pos.getX(i) * 0.5 + time * speed) +
      amp * 0.5 * Math.cos(pos.getY(i) * 0.3 + time * (speed * 1.5));

    if (onTropicalIsland) {
      const dx = pos.getX(i) - ISLAND_VX;
      const dy = pos.getY(i) - ISLAND_VY;
      const dist = Math.sqrt((dx / 1.32) ** 2 + dy ** 2);
      const mask = Math.min(1, Math.max(0, (dist - ISLAND_R) / 2.0));
      pos.setZ(i, wave * mask);
    } else if (onDesertLake) {
      const wx = pos.getX(i);
      const wz = -pos.getY(i);
      const nx = (wx - DESERT_CENTER_X) / DESERT_RADIUS_X;
      const nz = (wz - DESERT_CENTER_Z) / DESERT_RADIUS_Z;
      const normDist = Math.sqrt(nx * nx + nz * nz);
      const rawMask = Math.min(1, Math.max(0, (1 - normDist) / (1 - DESERT_EDGE_START)));
      const shoreMask = rawMask * rawMask * (3 - 2 * rawMask);
      const insideBridgeFrame =
        wx >= BRIDGE_FRAME_MIN_X &&
        wx <= BRIDGE_FRAME_MAX_X &&
        wz >= BRIDGE_FRAME_MIN_Z &&
        wz <= BRIDGE_FRAME_MAX_Z;
      const finalMask = insideBridgeFrame ? 0 : shoreMask;
      const calmWave = wave * DESERT_RIPPLE_FACTOR * finalMask;
      const targetLakeHeight = DESERT_WATER_LEVEL + calmWave;
      pos.setZ(i, DESERT_DRY_DEPTH * (1 - finalMask) + targetLakeHeight * finalMask);
    } else if (onArcticSea) {
      const wx = pos.getX(i);
      const wz = -pos.getY(i);
      const seaFrontMask = Math.min(1, Math.max(0, (ARCTIC_SEA_FRONT_Z - wz) / ARCTIC_SEA_BLEND));
      const insideBridge =
        wx >= ARCTIC_BRIDGE_MIN_X &&
        wx <= ARCTIC_BRIDGE_MAX_X &&
        wz >= ARCTIC_BRIDGE_MIN_Z &&
        wz <= ARCTIC_BRIDGE_MAX_Z;
      const finalMask = insideBridge ? 0 : seaFrontMask;
      pos.setZ(i, wave * finalMask + ARCTIC_DRY_DEPTH * (1 - finalMask));
    } else {
      pos.setZ(i, wave);
    }
  }

  pos.needsUpdate = true;
  waterGeo.computeVertexNormals();
}

export function getWaterColorHex(locationId: string): number {
  return getLocation(locationId).waterColor;
}
