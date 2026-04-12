import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useGameStore } from '../../store/useGameStore';

/** Fuldskærm CSS-lyn — synlig når torden-loop sætter `showLightning`. */
export function LightningOverlay() {
  const reducedMotion = useReducedMotion();
  const show = useGameStore((s) => s.showLightning);
  if (!show || reducedMotion) return null;
  return <div className="anim-lightning" aria-hidden />;
}
