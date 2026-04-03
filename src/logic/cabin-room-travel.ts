import { isCabinLocation } from './location-helpers.js';
import { useUIStore } from '../store/useUIStore.js';

const FADE_MS = 300;

/** Sandt når skift er mellem to forskellige hytterum (dør eller rejsemenu). */
export function isTravelBetweenCabinRooms(from: string, to: string): boolean {
  return isCabinLocation(from) && isCabinLocation(to) && from !== to;
}

/**
 * Kort fade til sort → skift lokation → fade ind.
 * Ved reduced motion eller ikke-hytte-til-hytte kaldes `onMidpoint` med det samme.
 */
export function runCabinRoomTravel(from: string, to: string, onMidpoint: () => void): void {
  if (!isTravelBetweenCabinRooms(from, to)) {
    onMidpoint();
    return;
  }
  const ui = useUIStore.getState();
  if (ui.reducedMotion) {
    onMidpoint();
    return;
  }

  const setOp = ui.setCabinRoomFadeOpacity;
  setOp(0);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setOp(1);
    });
  });

  window.setTimeout(() => {
    onMidpoint();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOp(0);
      });
    });
  }, FADE_MS);
}
