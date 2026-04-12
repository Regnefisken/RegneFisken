import { useEffect, useState } from 'react';
import { useUIStore } from '../store/useUIStore.js';

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Sand hvis brugeren har slået animationer fra i indstillinger ELLER OS/browser beder om reduceret bevægelse.
 */
export function useReducedMotion(): boolean {
  const uiReduced = useUIStore((s) => s.reducedMotion);
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setPrefersReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return uiReduced || prefersReduced;
}
