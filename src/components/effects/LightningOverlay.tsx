import { useGameStore } from '../../store/useGameStore';

/** Fuldskærm CSS-lyn — synlig når torden-loop sætter `showLightning`. */
export function LightningOverlay() {
  const show = useGameStore((s) => s.showLightning);
  if (!show) return null;
  return <div className="anim-lightning" aria-hidden />;
}
