import { useRef, type MouseEvent } from 'react';
import { useAudio } from '../../audio/useAudio';
import { makeId } from '../../logic/catch-engine';
import { useGameStore } from '../../store/useGameStore';
import { useFishingStore } from '../../store/useFishingStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { useCollectionStore } from '../../store/useCollectionStore';

/** Under shop/rejse-modaler (z-40 / z-9997), over kanvas (z-0) og kast-UI (z-20); under kiste (z-50). */
const bottomBar =
  'pointer-events-none fixed left-1/2 z-[48] flex -translate-x-1/2 flex-col items-center';

/** Bund-beskeder på molen: magnet/nøgle → fiskehytten (legacy-game.html ~12007–12068). */
export function PierCabinHint() {
  const { play } = useAudio();
  const pullingRef = useRef(false);

  const uiHidden = useUIStore((s) => s.uiHidden);
  const cabinRoomFadeOpacity = useUIStore((s) => s.cabinRoomFadeOpacity);
  const gameState = useGameStore((s) => s.gameState);
  const currentLocation = useGameStore((s) => s.currentLocation);

  const upgrades = usePlayerStore((s) => s.upgrades);
  const questItems = usePlayerStore((s) => s.questItems);

  const hasVisitedCabin = useCollectionStore((s) => s.hasVisitedCabin);
  const hasHeartBalloon = useCollectionStore((s) => s.hasHeartBalloon);
  const balloonCurrentHideout = useCollectionStore((s) => s.balloonCurrentHideout);

  const setLastCatch = useFishingStore((s) => s.setLastCatch);
  const setGameState = useGameStore((s) => s.setGameState);

  const loc = String(currentLocation).trim();
  /** Under sort rejse-fade er `currentLocation` ofte stadig den gamle — skjul hint så den ikke «hænger». */
  if (uiHidden || gameState !== 'idle' || loc !== 'pier' || cabinRoomFadeOpacity > 0.02) return null;

  const hasMagnet = upgrades.includes('magnet');
  const hasKey = questItems.includes('cabin_key');

  function pullKeyWithMagnet(e: MouseEvent<HTMLButtonElement>) {
    if (pullingRef.current || hasKey) return;
    pullingRef.current = true;
    const btn = e.currentTarget;
    btn.style.filter = 'brightness(1.6) drop-shadow(0 0 18px #FFD700)';
    window.setTimeout(() => {
      btn.style.filter = '';
    }, 220);

    play('cast');
    window.setTimeout(() => {
      play('splash');
      window.setTimeout(() => {
        play('win');
        setLastCatch({
          id: makeId(),
          species: 'Fiskehyttens Nøgle',
          weight: 0.1,
          value: 0,
          rarity: 'Quest',
          color: 0xdaa520,
          itemType: 'cabin_key',
        });
        setGameState('catch');
        pullingRef.current = false;
      }, 1150);
    }, 750);
  }

  return (
    <>
      {!hasMagnet && !hasKey && (
        <div
          className={bottomBar}
          style={{
            bottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div
            className="hud-floating-hint animate-pulse rounded-xl border px-4 py-2"
            style={{
              background: 'rgba(20,15,5,0.75)',
              borderColor: 'rgba(218,165,32,0.3)',
              color: '#fbbf24',
            }}
          >
            ✨ Der glimter noget gyldent i vandet...
          </div>
        </div>
      )}

      {hasMagnet && !hasKey && (
        <button
          type="button"
          className="pointer-events-auto fixed left-1/2 z-[48] flex -translate-x-1/2 flex-col items-center gap-1"
          style={{
            bottom: 'calc(12rem + env(safe-area-inset-bottom, 0px))',
            transition: 'filter 0.15s ease-out',
          }}
          title="Brug magneten i vandet"
          onClick={pullKeyWithMagnet}
        >
          <div
            className="flex flex-col items-center gap-1 rounded-2xl border-b-4 px-5 py-3 animate-pulse"
            style={{
              background: 'rgba(100,65,5,0.88)',
              borderColor: '#78350f',
              boxShadow: '0 0 18px rgba(218,165,32,0.35)',
            }}
          >
            <span className="text-[2rem] leading-none">🧲</span>
            <span
              className="font-black tracking-[0.15em] uppercase"
              style={{ color: '#fde68a', fontSize: '0.7rem' }}
            >
              Brug Magnet
            </span>
          </div>
        </button>
      )}

      {hasKey && !hasVisitedCabin && (
        <div
          className={bottomBar}
          style={{
            bottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div
            className="hud-floating-hint rounded-xl border px-4 py-2"
            style={{
              background: 'rgba(10,30,10,0.8)',
              borderColor: 'rgba(34,197,94,0.4)',
              color: '#86efac',
            }}
          >
            🗝️ Nøgle fundet — fiskehytten er låst op
          </div>
        </div>
      )}

      {hasHeartBalloon && balloonCurrentHideout === 'pier' && (
        <div
          className={bottomBar}
          style={{
            bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div
            className="hud-floating-hint animate-pulse rounded-xl border px-4 py-2"
            style={{
              background: 'rgba(40,10,30,0.82)',
              borderColor: 'rgba(244,114,182,0.45)',
              color: '#fbcfe8',
            }}
          >
            ❤️🎈 En magisk hjerteballon svæver over molen — den elsker gemmeleg!
          </div>
        </div>
      )}
    </>
  );
}
