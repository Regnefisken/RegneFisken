import { Suspense, lazy } from 'react';
import { useGameStore } from '../../store/useGameStore.js';
import { CaveDrips } from '../effects/CaveDrips.js';
import { AbyssMermaidNpc } from './AbyssMermaidNpc.js';
import { ForbiddenSeaNpcs } from './ForbiddenSeaNpcs.js';
import { LocationDock } from './LocationDock.js';
import { DesertLake } from './DesertLake.js';
import { ArcticSea } from './ArcticSea.js';
import { TropicalIsland } from './TropicalIsland.js';
import { FishingCabin } from './FishingCabin.js';

/** Kun grotte lazy-loades: mørk scene + pandelampe-UI giver naturlig buffer mod synlig pop-in. */
const CaveLazy = lazy(() => import('./Cave.js'));

/** Bro + lokationsspecifikt underlag — matcher legacy `buildBridgeForLocation` + location builders. */
export function LocationScenery() {
  const locationId = useGameStore((s) => s.currentLocation);

  return (
    <group>
      {locationId === 'forbidden' ? <ForbiddenSeaNpcs /> : null}
      {locationId === 'abyss' ? <AbyssMermaidNpc /> : null}
      {locationId === 'desert_lake' ? <DesertLake /> : null}
      {locationId === 'arctic_sea' ? <ArcticSea /> : null}
      {locationId === 'cave' ? (
        <Suspense fallback={null}>
          <CaveLazy />
          <CaveDrips />
        </Suspense>
      ) : null}
      {locationId === 'tropical_island' ? <TropicalIsland /> : null}
      {locationId === 'fishing_cabin' ? <FishingCabin /> : null}
      <LocationDock />
    </group>
  );
}
