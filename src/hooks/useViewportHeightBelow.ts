import { useCallback, useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

/** `true` når browservinduet er lavere end `px` — følger med, når vinduet ændrer størrelse. */
export function useViewportHeightBelow(px: number): boolean {
  const getSnapshot = useCallback(() => window.innerHeight < px, [px]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
