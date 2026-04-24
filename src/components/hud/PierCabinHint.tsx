import { useEffect, useRef, useState, type MouseEvent } from 'react';

/** Tid magneten «kæmper» pr. trin (1+2: kortere; 3: fuld, derefter splash → fangst). */
const MAGNET_STRUGGLE_MS_1 = 1300;
const MAGNET_STRUGGLE_MS_2 = 2500;
const MAGNET_STRUGGLE_MS_3 = 5000;
const MAGNET_AFTER_SPLASH_MS = 400;
import { useAudio } from '../../audio/useAudio';
import { makeId } from '../../logic/catch-engine';
import { useGameStore } from '../../store/useGameStore';
import { useFishingStore } from '../../store/useFishingStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { useCollectionStore } from '../../store/useCollectionStore';

/**
 * Tekst-hints (+ hjerteballon) under lokationstitel — fri for «Sælg alt»/streak i bunden.
 * Magnet-knappen forbliver nede (`calc(12rem + safe-area)`).
 */
const topRail =
  'pointer-events-none fixed left-1/2 z-[48] flex max-w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2 flex-col items-center gap-2 px-3 text-center';

/** Bund-beskeder på molen: magnet/nøgle → fiskehytten (legacy-game.html ~12007–12068). */
export function PierCabinHint() {
  const { play } = useAudio();
  const pullingRef = useRef(false);
  const [magnetStruggling, setMagnetStruggling] = useState(false);
  /** Hvilket træk (1–3) — nøglen fanges først efter 3. tryk. */
  const [magnetPullAttempt, setMagnetPullAttempt] = useState<1 | 2 | 3>(1);
  const magnetPullTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const uiHidden = useUIStore((s) => s.uiHidden);
  const uiMode = useUIStore((s) => s.uiMode);
  const cabinRoomFadeOpacity = useUIStore((s) => s.cabinRoomFadeOpacity);
  const gameState = useGameStore((s) => s.gameState);
  const currentLocation = useGameStore((s) => s.currentLocation);

  const upgrades = usePlayerStore((s) => s.upgrades);
  const questItems = usePlayerStore((s) => s.questItems);
  const playerLevel = usePlayerStore((s) => s.progression.level);
  const pierGoldenHintUnlocked = usePlayerStore((s) => s.pierGoldenHintUnlocked);
  const setPierGoldenHintUnlocked = usePlayerStore((s) => s.setPierGoldenHintUnlocked);

  const hasVisitedCabin = useCollectionStore((s) => s.hasVisitedCabin);
  const hasHeartBalloon = useCollectionStore((s) => s.hasHeartBalloon);
  const balloonCurrentHideout = useCollectionStore((s) => s.balloonCurrentHideout);

  const setLastCatch = useFishingStore((s) => s.setLastCatch);
  const setGameState = useGameStore((s) => s.setGameState);

  const loc = String(currentLocation).trim();

  useEffect(() => {
    if (loc !== 'pier' || playerLevel < 6 || pierGoldenHintUnlocked) return;
    setPierGoldenHintUnlocked(true);
  }, [loc, playerLevel, pierGoldenHintUnlocked, setPierGoldenHintUnlocked]);

  useEffect(
    () => () => {
      magnetPullTimersRef.current.forEach(clearTimeout);
      magnetPullTimersRef.current = [];
    },
    [],
  );

  useEffect(() => {
    if (loc !== 'pier') setMagnetPullAttempt(1);
  }, [loc]);

  /** Under sort rejse-fade er `currentLocation` ofte stadig den gamle — skjul hint så den ikke «hænger». */
  if (uiHidden || gameState !== 'idle' || loc !== 'pier' || cabinRoomFadeOpacity > 0.02) return null;

  const hasMagnet = upgrades.includes('magnet');
  const hasKey = questItems.includes('cabin_key');

  /**
   * Lodret plads mellem HUD-lokation og `Toast` (`top-36` = 9rem i `Toast.tsx`).
   * Ét `hud-floating-hint`-chip ≈ 2.2–2.5rem; gammel desktop-top 7.75rem → underkant ~10rem (overlap med toast).
   * Flyt ~1.5rem op på desktop (~0.5rem på mobil): én chip slutter ~8.5–8.7rem ≈ 0.3–0.5rem under toast-top.
   * (Ved 3 synlige hints kan stakken stadig nå toast — sjældent på samme tid.)
   */
  const pierHintTop =
    uiMode === 'mobile'
      ? 'max(4.25rem, calc(env(safe-area-inset-top, 0px) + 3.35rem))'
      : 'max(6.25rem, calc(4rem + env(safe-area-inset-top, 0px) + 2rem))';

  function pullKeyWithMagnet(e: MouseEvent<HTMLButtonElement>) {
    if (pullingRef.current || hasKey) return;
    const attempt = magnetPullAttempt;
    if (attempt === 1) {
      const fs = useFishingStore.getState();
      fs.setCabinKeyMagnetWarmup(true);
      fs.setUrgentPreload('cabin_key');
    }
    pullingRef.current = true;
    setMagnetStruggling(true);
    magnetPullTimersRef.current.forEach(clearTimeout);
    magnetPullTimersRef.current = [];

    const duration =
      attempt === 1 ? MAGNET_STRUGGLE_MS_1 : attempt === 2 ? MAGNET_STRUGGLE_MS_2 : MAGNET_STRUGGLE_MS_3;

    const btn = e.currentTarget;
    btn.style.filter = 'brightness(1.6) drop-shadow(0 0 18px #FFD700)';
    const flashId = window.setTimeout(() => {
      btn.style.filter = '';
    }, 220);
    magnetPullTimersRef.current.push(flashId);

    play('cast');

    const struggleId = window.setTimeout(() => {
      if (attempt < 3) {
        setMagnetPullAttempt((attempt + 1) as 1 | 2 | 3);
        pullingRef.current = false;
        setMagnetStruggling(false);
        return;
      }
      play('splash');
      const finishId = window.setTimeout(() => {
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
        setMagnetStruggling(false);
        setMagnetPullAttempt(1);
      }, MAGNET_AFTER_SPLASH_MS);
      magnetPullTimersRef.current.push(finishId);
    }, duration);
    magnetPullTimersRef.current.push(struggleId);
  }

  const showGoldenHint = pierGoldenHintUnlocked && !hasMagnet && !hasKey;
  const showKeyHint = hasKey && !hasVisitedCabin;
  const showBalloonHint = hasHeartBalloon && balloonCurrentHideout === 'pier';

  return (
    <>
      {(showGoldenHint || showKeyHint || showBalloonHint) && (
        <div className={topRail} style={{ top: pierHintTop }}>
          {showGoldenHint && (
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
          )}
          {showKeyHint && (
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
          )}
          {showBalloonHint && (
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
          )}
        </div>
      )}

      {hasMagnet && !hasKey && (
        <button
          type="button"
          disabled={magnetStruggling}
          className="pointer-events-auto fixed left-1/2 z-[48] flex -translate-x-1/2 flex-col items-center gap-1 disabled:opacity-95"
          style={{
            bottom: 'calc(12rem + env(safe-area-inset-bottom, 0px))',
            transition: 'filter 0.15s ease-out',
          }}
          title="Brug magneten i vandet"
          onClick={pullKeyWithMagnet}
        >
          <div
            className={`flex flex-col items-center gap-1 rounded-2xl border-b-4 px-5 py-3 ${
              !magnetStruggling
                ? 'animate-pulse'
                : magnetPullAttempt === 1
                  ? 'pier-magnet-struggle-t1'
                  : magnetPullAttempt === 2
                    ? 'pier-magnet-struggle-t2'
                    : 'pier-magnet-struggle-t3'
            }`}
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
    </>
  );
}
