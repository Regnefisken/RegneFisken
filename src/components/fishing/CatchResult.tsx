import { useGameStore } from '../../store/useGameStore';
import { useFishingStore } from '../../store/useFishingStore';
import { rarityTextClass } from '../hud/rarityColor';

export function CatchResult() {
  const gameState = useGameStore((s) => s.gameState);
  const lastCatch = useFishingStore((s) => s.lastCatch);

  if (gameState !== 'catch' || !lastCatch) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="anim-zoom-in panel-dark max-w-md rounded-3xl border-4 border-emerald-500 p-8 text-center shadow-2xl">
        <div className="mb-2 text-6xl">🎣</div>
        <h2 className={`text-4xl font-black ${rarityTextClass(lastCatch)}`}>{lastCatch.species}</h2>
        <p className="mt-2 text-slate-400">
          {lastCatch.weight} kg · +{lastCatch.value} kr
        </p>
      </div>
    </div>
  );
}
