import { TRAVEL_FADE_MS } from '../../logic/cabin-room-travel.js';
import { useUIStore } from '../../store/useUIStore';

/** Fuldskærms sort fade ved skift mellem hytterum (over canvas, HUD og rejse-modal). */
export function CabinRoomTravelFade() {
  const opacity = useUIStore((s) => s.cabinRoomFadeOpacity);
  const reducedMotion = useUIStore((s) => s.reducedMotion);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9998] bg-black"
      style={{
        opacity,
        transition: reducedMotion ? 'none' : `opacity ${TRAVEL_FADE_MS}ms ease`,
      }}
      aria-hidden
    />
  );
}
