import { Suspense, lazy } from 'react';
import { useGameStore } from '../../store/useGameStore.js';
import { LocationDock } from './LocationDock.js';

const DesertLake = lazy(() => import('./DesertLake.js'));
const ArcticSea = lazy(() => import('./ArcticSea.js'));
const Cave = lazy(() => import('./Cave.js'));
const TropicalIsland = lazy(() => import('./TropicalIsland.js'));
const FishingCabin = lazy(() => import('./FishingCabin.js'));
const ForbiddenSeaNpcs = lazy(() => import('./ForbiddenSeaNpcs.js'));
const AbyssMermaidNpc = lazy(() => import('./AbyssMermaidNpc.js'));

/** Bro + lokationsspecifikt underlag — matcher legacy `buildBridgeForLocation` + location builders. */
export function LocationScenery() {
  const locationId = useGameStore((s) => s.currentLocation);

  return (
    <Suspense fallback={null}>
      <group>
        {locationId === 'forbidden' ? <ForbiddenSeaNpcs /> : null}
        {locationId === 'abyss' ? <AbyssMermaidNpc /> : null}
        {locationId === 'desert_lake' ? <DesertLake /> : null}
        {locationId === 'arctic_sea' ? <ArcticSea /> : null}
        {locationId === 'cave' ? <Cave /> : null}
        {locationId === 'tropical_island' ? <TropicalIsland /> : null}
        {locationId === 'fishing_cabin' ? <FishingCabin /> : null}
        <LocationDock />
      </group>
    </Suspense>
  );
}
