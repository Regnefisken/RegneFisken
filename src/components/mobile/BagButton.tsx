import { useAudio } from '../../audio/useAudio';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { CoinIcon } from '../common/CoinIcon';

/** Synk med knappens `style.bottom` / størrelse — stats-stakken placeres ovenpå. */
const MOBILE_BAG_BUTTON_BOTTOM = '5.35rem';
const MOBILE_BAG_BUTTON_SIZE = '7rem';
const MOBILE_BAG_STATS_GAP = '0.5rem';

/** 🎒 Fisketaske + LVL/mønter-stak — kun mobil, idle, bag lukket (legacy showCornerButtons). */
export function BagButton() {
  const { play } = useAudio();
  const gameState = useGameStore((s) => s.gameState);
  const uiMode = useUIStore((s) => s.uiMode);
  const uiHidden = useUIStore((s) => s.uiHidden);
  const isBagOpen = useUIStore((s) => s.isBagOpen);
  const setIsBagOpen = useUIStore((s) => s.setIsBagOpen);
  const setBagTab = useUIStore((s) => s.setBagTab);

  const playerLevel = usePlayerStore((s) => s.progression.level);
  const coins = usePlayerStore((s) => s.coins);

  const showCornerButtons = gameState === 'idle' && !isBagOpen;

  if (uiMode !== 'mobile' || uiHidden || !showCornerButtons) return null;

  const statsBottom = `calc(${MOBILE_BAG_BUTTON_BOTTOM} + ${MOBILE_BAG_BUTTON_SIZE} + ${MOBILE_BAG_STATS_GAP})`;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed right-4 z-[9975] flex w-[7rem] min-w-0 flex-col gap-2"
        style={{ bottom: statsBottom }}
      >
        <div className="panel-hud flex min-h-11 w-full min-w-0 items-center justify-center rounded-2xl border border-slate-700 px-3 py-1.5 shadow-xl">
          <span className="flex items-center gap-1 text-xs font-black leading-none tracking-widest text-yellow-300 uppercase">
            <span className="inline-flex select-none" aria-hidden>
              ⭐
            </span>
            <span>LVL {playerLevel}</span>
          </span>
        </div>
        <div className="btn-glass flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-2xl border border-white/20 px-3 py-1.5 shadow-xl">
          <span className="inline-flex shrink-0 text-xs leading-none" aria-hidden>
            <CoinIcon size={12} className="block" />
          </span>
          <span className="min-w-0 font-mono text-sm font-bold leading-none tracking-tight text-yellow-100 tabular-nums">
            {coins.toLocaleString('da-DK', { useGrouping: false })}
          </span>
        </div>
      </div>
      <button
        type="button"
        aria-label="Åbn Fisketaske"
        className="btn-glass pointer-events-auto touch-manipulation fixed right-4 z-[9980] flex cursor-pointer items-center justify-center rounded-2xl border border-white/20 text-[2.2rem] font-black leading-none text-white shadow-lg transition-all hover:scale-110 active:scale-95"
        style={{
          bottom: MOBILE_BAG_BUTTON_BOTTOM,
          width: MOBILE_BAG_BUTTON_SIZE,
          height: MOBILE_BAG_BUTTON_SIZE,
        }}
        onClick={() => {
          play('ui');
          setBagTab('menu');
          setIsBagOpen(true);
        }}
      >
        🎒
      </button>
    </>
  );
}
