import { useAudio } from '../../audio/useAudio';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { rarityTextClass } from '../hud/rarityColor';

export function JournalScreen() {
  const { play } = useAudio();
  const setGameState = useGameStore((s) => s.setGameState);
  const inventory = usePlayerStore((s) => s.inventory);

  function onClose() {
    play('ui');
    setGameState('idle');
  }

  return (
    <div className="panel-shop anim-zoom-in pointer-events-auto max-h-[80dvh] w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-700 p-4">
        <h2 className="text-2xl font-black text-sky-300">📖 Journal</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-slate-800 px-3 py-1.5 text-sm font-bold text-slate-300 hover:bg-slate-700"
        >
          Luk
        </button>
      </div>
      <div className="scrollbar-hide max-h-[60dvh] space-y-2 overflow-y-auto p-4 text-sm">
        {inventory.length === 0 ? (
          <p className="text-slate-500 italic">Ingen fangster endnu.</p>
        ) : (
          inventory.map((f) => (
            <div key={f.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-3">
              <div className={`font-bold ${rarityTextClass(f)}`}>{f.species}</div>
              <div className="text-xs text-slate-500">
                {f.weight} kg · {f.rarity}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
