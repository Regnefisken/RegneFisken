import { useGameStore } from '../../store/useGameStore.js';
import { LocationDock } from './LocationDock.js';
import { DesertLake } from './DesertLake.js';
import { ArcticSea } from './ArcticSea.js';
import { Cave } from './Cave.js';
import { TropicalIsland } from './TropicalIsland.js';

/** Bro + lokationsspecifikt underlag — matcher legacy `buildBridgeForLocation` + location builders. */
export function LocationScenery() {
  const locationId = useGameStore((s) => s.currentLocation);

  return (
    <group>
      {locationId === 'desert_lake' ? <DesertLake /> : null}
      {locationId === 'arctic_sea' ? <ArcticSea /> : null}
      {locationId === 'cave' ? <Cave /> : null}
      {locationId === 'tropical_island' ? <TropicalIsland /> : null}
      <LocationDock />
    </group>
  );
}
