import { lazy, Suspense } from 'react';
import { useGameStore } from '../../store/useGameStore.js';
import { CaveDrips } from '../effects/CaveDrips.js';
import { CabinBedroom } from './CabinBedroom.js';
import { CabinKitchen } from './CabinKitchen.js';
import { FishingCabin } from './FishingCabin.js';
import { LocationDock } from './LocationDock.js';

const CaveLazy = lazy(() => import('./Cave.js'));
const AbyssMermaidNpcLazy = lazy(() =>
  import('./AbyssMermaidNpc.js').then((m) => ({ default: m.AbyssMermaidNpc })),
);
const ForbiddenSeaNpcsLazy = lazy(() =>
  import('./ForbiddenSeaNpcs.js').then((m) => ({ default: m.ForbiddenSeaNpcs })),
);
const DesertLakeLazy = lazy(() =>
  import('./DesertLake.js').then((m) => ({ default: m.DesertLake })),
);
const ArcticSeaLazy = lazy(() =>
  import('./ArcticSea.js').then((m) => ({ default: m.ArcticSea })),
);
const TropicalIslandLazy = lazy(() =>
  import('./TropicalIsland.js').then((m) => ({ default: m.TropicalIsland })),
);
const JungleIslandLazy = lazy(() =>
  import('./JungleIsland.js').then((m) => ({ default: m.JungleIsland })),
);

/** Bro + lokationsspecifikt underlag. */
export function LocationScenery() {
  const locationId = useGameStore((s) => s.currentLocation);

  return (
    <group>
      <Suspense fallback={null}>
        {locationId === 'forbidden' ? <ForbiddenSeaNpcsLazy /> : null}
        {locationId === 'abyss' ? <AbyssMermaidNpcLazy /> : null}
        {locationId === 'desert_lake' ? <DesertLakeLazy /> : null}
        {locationId === 'arctic_sea' ? <ArcticSeaLazy /> : null}
        {locationId === 'cave' ? (
          <>
            <CaveLazy />
            <CaveDrips />
          </>
        ) : null}
        {locationId === 'tropical_island' ? <TropicalIslandLazy /> : null}
        {locationId === 'cabin_kitchen' ? <CabinKitchen /> : null}
        {locationId === 'cabin_bedroom' ? <CabinBedroom /> : null}
        {locationId === 'cabin_living' ? <FishingCabin /> : null}
        {locationId === 'jungle_island' ? <JungleIslandLazy /> : null}
      </Suspense>
      <LocationDock />
    </group>
  );
}
