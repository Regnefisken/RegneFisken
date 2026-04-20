import { useAudio } from '../../audio/useAudio';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';

/** Når tiden løber ud (eller kraken-tab) — samme kopi som legacy `gameState === 'lost' | kraken_lost`. */
export function LostFightModal() {
  const { play } = useAudio();
  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);
  const krakenLoss = usePlayerStore((s) => s.krakenLoss);

  function dismiss() {
    play('ui');
    setGameState('idle');
  }

  if (gameState === 'kraken_lost') {
    return (
      <div className="pointer-events-auto fixed inset-0 z-[10032] flex items-center justify-center bg-black/50 p-4">
        <div
          className="anim-zoom-in max-w-sm w-full rounded-3xl border-4 p-10 text-center shadow-2xl"
          style={{
            borderColor: '#6B006B',
            background: 'rgba(30,0,40,0.97)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div
            className="mb-4 animate-pulse text-8xl"
            style={{ filter: 'drop-shadow(0 0 30px purple)' }}
          >
            🐙
          </div>
          <h2 className="mb-3 text-3xl font-black text-purple-300">Krakenen angriber!</h2>
          <p className="mb-2 text-base leading-relaxed font-medium text-purple-100">
            Krakenen slog dine mønter ud af hånden!
          </p>
          <p className="mb-6 font-mono text-2xl font-black text-red-300">-{krakenLoss} kr tabt!</p>
          <button
            type="button"
            onClick={dismiss}
            className="w-full rounded-2xl border-2 py-4 text-xl font-bold transition-colors"
            style={{ background: '#3b0048', color: '#d8b4fe', borderColor: '#6B006B' }}
          >
            Fortsæt med livet…
          </button>
        </div>
      </div>
    );
  }

  if (gameState !== 'lost') return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-[10032] flex items-center justify-center bg-black/50 p-4">
      <div
        className="anim-zoom-in max-w-sm w-full rounded-3xl border-4 border-red-500/50 p-10 text-center shadow-2xl"
        style={{
          background: 'rgba(127,29,29,0.92)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 0 60px rgba(220,38,38,0.4)',
        }}
      >
        <div className="mb-6 animate-bounce text-7xl">💨</div>
        <h2 className="mb-4 text-4xl font-black text-white">Den slap væk!</h2>
        <p className="mb-8 text-lg leading-relaxed font-medium text-red-200">
          Godt forsøgt! Bedre held næste gang.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="w-full rounded-2xl bg-white py-4 text-xl font-bold text-red-900 shadow-lg transition-colors hover:bg-red-50"
        >
          Prøv Igen
        </button>
      </div>
    </div>
  );
}
