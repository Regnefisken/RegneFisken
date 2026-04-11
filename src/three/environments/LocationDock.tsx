import { isCabinLocation } from '../../logic/location-helpers.js';
import { useGameStore } from '../../store/useGameStore.js';
import { Pier } from './Pier.js';
import { StonePier } from './StonePier.js';
import { PiratePier } from './PiratePier.js';
import { MarinaPier } from './MarinaPier.js';
import { RuinPier } from './RuinPier.js';

const WOOD_IDS = new Set([
  'pier',
  'smaragd',
  'tropical_island',
  'forbidden',
  'abyss',
]);

/** Bro/mole valgt ud fra `currentLocation` — matcher legacy `buildBridgeForLocation`. */
export function LocationDock() {
  const locationId = useGameStore((s) => s.currentLocation);

  if (isCabinLocation(locationId)) return null;
  /* jungle_island: bro følger lazy `JungleIsland` (undgår bro uden ø / forkert rækkefølge). */
  if (locationId === 'jungle_island') return null;
  if (locationId === 'desert_lake') return <StonePier />;
  if (locationId === 'forbidden') return <PiratePier />;
  if (locationId === 'arctic_sea') return <MarinaPier />;
  if (locationId === 'cave') return <RuinPier />;
  if (WOOD_IDS.has(locationId)) return <Pier />;
  return <Pier />;
}
