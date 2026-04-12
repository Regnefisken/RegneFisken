import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useUIStore } from '../../store/useUIStore';

const SESSION_KEY = 'regnefisken_jungle_orientation_hint_dismissed';

function isPortraitSize(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < window.innerHeight;
}

function debounce(fn: () => void, ms: number): () => void {
  let t: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      fn();
    }, ms);
  };
}

/**
 * På mobil i portræt på jungleø: anbefal landskab. Kan lukkes; valg gemmes i sessionStorage.
 */
export function OrientationGuard() {
  const uiMode = useUIStore((s) => s.uiMode);
  const currentLocation = useGameStore((s) => s.currentLocation);

  const [portrait, setPortrait] = useState(isPortraitSize);
  const [dismissed, setDismissed] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1',
  );

  useEffect(() => {
    const update = () => setPortrait(isPortraitSize());
    const debounced = debounce(update, 150);
    window.addEventListener('resize', debounced);
    window.addEventListener('orientationchange', debounced);
    update();
    return () => {
      window.removeEventListener('resize', debounced);
      window.removeEventListener('orientationchange', debounced);
    };
  }, []);

  const active =
    uiMode === 'mobile' && currentLocation === 'jungle_island' && portrait && !dismissed;

  if (!active) return null;

  return (
    <button
      type="button"
      className="touch-manipulation fixed inset-0 z-[60] flex cursor-pointer flex-col items-center justify-center gap-4 border-0 bg-black/72 p-6 text-center text-white backdrop-blur-[2px]"
      onClick={() => {
        try {
          sessionStorage.setItem(SESSION_KEY, '1');
        } catch {
          /* private mode */
        }
        setDismissed(true);
      }}
      aria-label="Luk besked om at dreje skærmen"
    >
      <span className="text-6xl" aria-hidden>
        🔄
      </span>
      <p className="max-w-sm text-lg font-bold leading-snug">
        Drej din enhed for bedre oplevelse på Jungleøen
      </p>
      <p className="text-sm font-medium text-white/70">Tryk et vilkårligt sted for at lukke</p>
    </button>
  );
}
