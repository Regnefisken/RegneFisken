import { isCabinLocation } from './location-helpers.js';
import { useUIStore } from '../store/useUIStore.js';

/** Stue, køkken, soveværelse — samme som `isCabinLocation`. */
function isCabinInteriorTravelNode(id: string): boolean {
  return isCabinLocation(id) || id === 'cabin_cellar';
}

/** Sandt når skift er mellem to forskellige hytterum (dør eller rejsemenu), inkl. kælder. */
export function isTravelBetweenCabinRooms(from: string, to: string): boolean {
  return isCabinInteriorTravelNode(from) && isCabinInteriorTravelNode(to) && from !== to;
}

/**
 * Adaptiv fade til sort → lokationsskift → fade ind.
 * Venter på Promise.all([importDone, minWait]) så faden aldrig er kortere end
 * CSS-transitionens varighed, men heller ikke unødigt længere end load kræver.
 *
 * Preloader-map fyldes i `locationPreloaders` (samme stier som LocationScenery lazy).
 */
/** Synkroniseret med `CabinRoomTravelFade` (CSS transition). Lidt længere end 300ms for roligere skift. */
export const TRAVEL_FADE_MS = 380;

/**
 * Sort skærm efter `setCurrentLocation`: Suspense skal committe lazy-miljø, underchunks kan
 * hente efter hoved-import, og Three.js skal nå første compile — 72 ms var for lidt (pop-in).
 */
const TRAVEL_POST_MIDPOINT_MS = 320;

export const locationPreloaders: Partial<Record<string, () => Promise<unknown>>> = {
  abyss: () => import('../three/environments/AbyssMermaidNpc.js'),
  forbidden: () => import('../three/environments/ForbiddenSeaNpcs.js'),
  desert_lake: () => import('../three/environments/DesertLake.js'),
  arctic_sea: () => import('../three/environments/ArcticSea.js'),
  cave: () => import('../three/environments/Cave.js'),
  tropical_island: () => import('../three/environments/TropicalIsland.js'),
  cabin_living: () => import('../three/environments/FishingCabin.js'),
  cabin_kitchen: () => import('../three/environments/CabinKitchen.js'),
  cabin_bedroom: () => import('../three/environments/CabinBedroom.js'),
  jungle_island: () => import('../three/environments/JungleIsland.js'),
};

export function runLocationTravel(destinationId: string, onMidpoint: () => void): void {
  const ui = useUIStore.getState();
  if (ui.reducedMotion) {
    onMidpoint();
    return;
  }

  const setOp = ui.setCabinRoomFadeOpacity;

  const importDone: Promise<unknown> =
    locationPreloaders[destinationId]?.() ?? Promise.resolve();

  // Start import med det samme; minimum-tid måler fra sort fade *begynder* (matcher CSS 0→1).
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setOp(1);
      const minWait = new Promise<void>((r) => setTimeout(r, TRAVEL_FADE_MS));
      void Promise.all([importDone, minWait]).then(() => {
        onMidpoint();
        window.setTimeout(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => setOp(0));
            });
          });
        }, TRAVEL_POST_MIDPOINT_MS);
      });
    });
  });
}

/**
 * Kort sort fade før fuldskærms-overlay i hytten (fx spejl / klædeskab).
 * Ved reduced motion kaldes `onMidpoint` med det samme.
 */
export function runCabinOverlayFade(onMidpoint: () => void): void {
  const ui = useUIStore.getState();
  if (ui.reducedMotion) {
    onMidpoint();
    return;
  }
  const setOp = ui.setCabinRoomFadeOpacity;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setOp(1);
      window.setTimeout(() => {
        onMidpoint();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setOp(0);
          });
        });
      }, TRAVEL_FADE_MS);
    });
  });
}
