import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio } from '../../audio/useAudio';
import { getFinalStreakBonus, xpForCatch } from '../../logic/xp-engine';
import {
  CHEST_BASE_COINS,
  rollChestWardrobeBonus,
} from '../../logic/wardrobeLoot';
import type { RollCatchResult } from '../../types/fish';
import { useBucketDropStore } from '../../store/useBucketDropStore';
import { useFishingStore } from '../../store/useFishingStore';
import { useGameStore } from '../../store/useGameStore';
import { useMathStore } from '../../store/useMathStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { rarityTextClass } from '../hud/rarityColor';
import { CATCH_OVERLAY_SHELL } from './catchOverlayLayout';
import { WARDROBE_ITEMS } from '../../data/wardrobeItems';

const SHAKE_MS = 780;
const REVEAL_DOUBLE_MS = 720;
const REVEAL_NONE_MS = 420;

function shouldAnimateFishToBucket(fish: RollCatchResult): boolean {
  return (
    fish.itemType !== 'bottle' &&
    fish.itemType !== 'plesiosaur' &&
    fish.itemType !== 'halibut' &&
    fish.itemType !== 'golden_frog' &&
    fish.itemType !== 'axolotl' &&
    fish.itemType !== 'fossil' &&
    fish.itemType !== 'conch' &&
    fish.itemType !== 'crystal_junk'
  );
}

/** Skattekiste-illustration (400×300 viewBox) — skaleres i UI via className. */
function TreasureChestIllustration({
  className,
  shaking,
}: {
  className?: string;
  shaking?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid meet"
      className={`${className ?? ''} ${shaking ? 'chest-shake' : ''}`}
      aria-hidden
    >
      <title>Skattekiste</title>
      {/* Farver som den gamle 2D-kiste: mørkt træ (#6b3e1f / #7a4a24), dybere guld (#c9a227 / #d4af37 / #ffd700). */}
      {/* Body wood base */}
      <rect
        x="48"
        y="118"
        width="304"
        height="155"
        rx="6"
        fill="#6b3e1f"
        stroke="#3d240f"
        strokeWidth="14"
      />
      {/* Vertical wood planks (lysere end korpus, som gamle låg-træ) */}
      <rect x="72" y="122" width="21" height="147" fill="#7a4a24" />
      <rect x="101" y="122" width="21" height="147" fill="#7a4a24" />
      <rect x="130" y="122" width="21" height="147" fill="#7a4a24" />
      <rect x="159" y="122" width="21" height="147" fill="#7a4a24" />
      <rect x="188" y="122" width="21" height="147" fill="#7a4a24" />
      <rect x="217" y="122" width="21" height="147" fill="#7a4a24" />
      <rect x="246" y="122" width="21" height="147" fill="#7a4a24" />
      <rect x="275" y="122" width="21" height="147" fill="#7a4a24" />
      {/* Vertical gold bands */}
      <rect x="61" y="118" width="23" height="155" rx="3" fill="#c9a227" stroke="#8a6a18" strokeWidth="6" />
      <rect x="316" y="118" width="23" height="155" rx="3" fill="#c9a227" stroke="#8a6a18" strokeWidth="6" />
      {/* Horizontal gold band */}
      <rect x="48" y="175" width="304" height="34" rx="3" fill="#c9a227" stroke="#8a6a18" strokeWidth="7" />
      {/* Feet */}
      <rect x="68" y="265" width="30" height="18" rx="2" fill="#6b3e1f" stroke="#3d240f" strokeWidth="6" />
      <rect x="302" y="265" width="30" height="18" rx="2" fill="#6b3e1f" stroke="#3d240f" strokeWidth="6" />
      {/* Lid base */}
      <rect x="46" y="83" width="308" height="37" rx="4" fill="#d4af37" stroke="#9a7614" strokeWidth="10" />
      {/* Arched lid top */}
      <path
        d="M 46,83 C 48,54 65,41 98,37 C 135,31 165,27 200,27 C 235,27 265,31 302,37 C 335,41 352,54 354,83 L 46,83 z"
        fill="#d4af37"
        stroke="#9a7614"
        strokeWidth="10"
      />
      {/* Lock plate */}
      <rect x="172" y="162" width="56" height="52" rx="7" fill="#ffd700" stroke="#b8860b" strokeWidth="5" />
      <ellipse cx="200" cy="180" rx="7.5" ry="8.5" fill="#3d240f" />
      <rect x="197" y="180" width="6" height="26" rx="1.5" fill="#3d240f" />
      {/* Rivets — vertical bands */}
      <circle cx="72.5" cy="138" r="4.5" fill="#3d240f" />
      <circle cx="72.5" cy="178" r="4.5" fill="#3d240f" />
      <circle cx="72.5" cy="218" r="4.5" fill="#3d240f" />
      <circle cx="327.5" cy="138" r="4.5" fill="#3d240f" />
      <circle cx="327.5" cy="178" r="4.5" fill="#3d240f" />
      <circle cx="327.5" cy="218" r="4.5" fill="#3d240f" />
      {/* Rivets — horizontal band */}
      <circle cx="92" cy="191" r="4" fill="#3d240f" />
      <circle cx="308" cy="191" r="4" fill="#3d240f" />
    </svg>
  );
}

/**
 * Viser **kort-SVG** (`svgCard`) — samme asset som garderobe-grid, ikke `svgAvatar` på figuren.
 * Dermed påvirkes ikke avatar-offsets fra `renderAvatarSvg` / klædeskabet.
 */
function WardrobeUnlockCardPreview({
  itemId,
  onTagMed,
}: {
  itemId: string;
  onTagMed: () => void;
}) {
  const item = WARDROBE_ITEMS.find((i) => i.id === itemId);
  const name = item?.name ?? itemId;
  const svg = item?.svgCard;

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm font-black uppercase tracking-wider text-amber-300">Ny ting!</p>
      {svg ? (
        <div
          className="flex h-44 w-44 items-center justify-center rounded-2xl border-4 border-amber-400/90 bg-gradient-to-b from-slate-900/90 to-black/80 p-3 shadow-[0_0_28px_rgba(251,191,36,0.35)] md:h-48 md:w-48 [&_svg]:max-h-full [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="flex h-36 w-36 items-center justify-center rounded-2xl border-4 border-amber-400/60 bg-black/50 text-5xl md:h-40 md:w-40">
          👕
        </div>
      )}
      <p className="max-w-[18rem] text-center text-2xl font-black leading-tight text-white md:text-3xl">{name}</p>
      <button
        type="button"
        onClick={onTagMed}
        className="w-full max-w-xs rounded-2xl border-b-4 border-sky-900 bg-sky-600 py-4 text-xl font-bold text-white shadow-xl transition hover:bg-sky-500 hover:scale-[1.02] active:scale-95"
      >
        Tag med
      </button>
    </div>
  );
}

type ChestOutcome =
  | { kind: 'none'; catchRow: RollCatchResult }
  | { kind: 'item'; itemId: string; name: string; catchRow: RollCatchResult }
  | { kind: 'double'; add: number; catchRow: RollCatchResult };

type Props = {
  lastCatch: RollCatchResult;
};

/**
 * Løsning A: én primær handling — ryst → RNG → evt. kort-preview → spand (samme som tidligere `keepFish`).
 */
export function SunketChestCatchPanel({ lastCatch }: Props) {
  const { play } = useAudio();
  const setGameState = useGameStore((s) => s.setGameState);
  const setLastCatch = useFishingStore((s) => s.setLastCatch);
  const currentStreak = useFishingStore((s) => s.currentStreak);
  const upgrades = usePlayerStore((s) => s.upgrades);
  const zenMode = useMathStore((s) => s.zenMode);
  const ownedIdsArr = usePlayerStore((s) => s.ownedWardrobeItemIds);
  const addOwnedWardrobeItemId = usePlayerStore((s) => s.addOwnedWardrobeItemId);
  const setInventory = usePlayerStore((s) => s.setInventory);
  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const uiMode = useUIStore((s) => s.uiMode);
  const conchBaitExpiry = usePlayerStore((s) => s.conchBaitExpiry);
  const flyBaitExpiry = usePlayerStore((s) => s.flyBaitExpiry);
  const hajBloodExpiry = usePlayerStore((s) => s.hajBloodExpiry);
  const perleLimExpiry = usePlayerStore((s) => s.perleLimExpiry);
  const { isPortrait } = useIsMobile();

  const [isOpening, setIsOpening] = useState(false);
  const [revealItemId, setRevealItemId] = useState<string | null>(null);
  const [moneyFlash, setMoneyFlash] = useState<number | null>(null);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  const pushTimeout = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  const fishModelId = lastCatch.fishModelId ?? '';
  const baseCoins = CHEST_BASE_COINS[fishModelId] ?? lastCatch.value;

  const xpEarned = xpForCatch(lastCatch) + (upgrades.includes('luxury_boat') ? 15 : 0);
  const streakBonusShown = getFinalStreakBonus(currentStreak, zenMode, lastCatch.value);

  const upgradeBadges: { icon: string; text: string; color: string }[] = [];
  if (upgrades.includes('heldig_firkloever'))
    upgradeBadges.push({ icon: '🍀', text: '+8 Held', color: '#4ade80' });
  if (upgrades.includes('pirate_hat')) upgradeBadges.push({ icon: '🏴‍☠️', text: '+5 Held', color: '#fbbf24' });
  if (upgrades.includes('golden_hook')) upgradeBadges.push({ icon: '🪝', text: '+15 Rigdom', color: '#fde047' });
  if (upgrades.includes('luxury_boat')) upgradeBadges.push({ icon: '⛵', text: '+15 Erfaring', color: '#a78bfa' });
  if (Date.now() < conchBaitExpiry) upgradeBadges.push({ icon: '🍯', text: '+6 Held', color: '#f9a8d4' });
  if (Date.now() < hajBloodExpiry) upgradeBadges.push({ icon: '🩸', text: '+15 Held', color: '#fca5a5' });
  if (Date.now() < flyBaitExpiry) upgradeBadges.push({ icon: '🪰', text: '+12 Held', color: '#a3e635' });
  if (Date.now() < perleLimExpiry) upgradeBadges.push({ icon: '🦪', text: '+15 Held', color: '#c4b5fd' });

  const isMobileCatchPanel = uiMode === 'mobile';
  const mobileLandscapeCatch = isMobileCatchPanel && !isPortrait;

  const panelShellClass = isMobileCatchPanel
    ? mobileLandscapeCatch
      ? 'anim-zoom-in panel-black pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border border-amber-500/30 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
      : 'anim-zoom-in panel-black pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-amber-500/30 p-4 text-center shadow-2xl'
    : 'anim-zoom-in panel-black pointer-events-auto relative mt-auto mb-2 w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/30 p-8 text-center shadow-2xl md:mt-80';

  const executeChestBonus = useCallback((): ChestOutcome => {
    const owned = new Set(ownedIdsArr);
    const roll = rollChestWardrobeBonus(fishModelId, owned, Math.random);

    if (roll.kind === 'none') {
      return { kind: 'none', catchRow: lastCatch };
    }

    if (roll.kind === 'item') {
      addOwnedWardrobeItemId(roll.itemId);
      const name = WARDROBE_ITEMS.find((i) => i.id === roll.itemId)?.name ?? roll.itemId;
      play('legendary');
      return { kind: 'item', itemId: roll.itemId, name, catchRow: lastCatch };
    }

    const add = baseCoins;
    const updated = { ...lastCatch, value: lastCatch.value + add };
    setInventory((inv) =>
      inv.map((row) => (row.id === lastCatch.id ? { ...row, value: row.value + add } : row)),
    );
    setLastCatch(updated);
    setToastMessage(`Kisten gav +${add} kr ekstra!`);
    play('win');
    return { kind: 'double', add, catchRow: updated };
  }, [
    addOwnedWardrobeItemId,
    baseCoins,
    fishModelId,
    lastCatch,
    ownedIdsArr,
    play,
    setInventory,
    setLastCatch,
    setToastMessage,
  ]);

  const finalizeToBucket = useCallback(
    (catchRow: RollCatchResult) => {
      play('ui');
      if (shouldAnimateFishToBucket(catchRow)) {
        useBucketDropStore.getState().enqueue(catchRow);
      }
      setLastCatch(null);
      setGameState('idle');
    },
    [play, setGameState, setLastCatch],
  );

  function handleTagMed() {
    finalizeToBucket(lastCatch);
    setRevealItemId(null);
  }

  function handleOpenChest() {
    if (isOpening) return;
    setIsOpening(true);
    play('ui');

    pushTimeout(() => {
      const outcome = executeChestBonus();

      if (outcome.kind === 'item') {
        setRevealItemId(outcome.itemId);
        setIsOpening(false);
        return;
      }

      if (outcome.kind === 'double') {
        setMoneyFlash(outcome.add);
        pushTimeout(() => {
          finalizeToBucket(outcome.catchRow);
          setIsOpening(false);
          setMoneyFlash(null);
        }, REVEAL_DOUBLE_MS);
        return;
      }

      pushTimeout(() => {
        finalizeToBucket(outcome.catchRow);
        setIsOpening(false);
      }, REVEAL_NONE_MS);
    }, SHAKE_MS);
  }

  const shaking = isOpening && !revealItemId && moneyFlash === null;

  return (
    <>
      <style>{`
        @keyframes chest-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          20% { transform: translateX(-6px) rotate(-2deg); }
          40% { transform: translateX(6px) rotate(2deg); }
          60% { transform: translateX(-4px) rotate(-1deg); }
          80% { transform: translateX(4px) rotate(1deg); }
        }
        .chest-shake { animation: chest-shake 0.55s ease-in-out infinite; }
      `}</style>
      <div
        className={`${CATCH_OVERLAY_SHELL} !z-[10040]${
          mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
        }`}
      >
        <div className={panelShellClass}>
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl opacity-25"
            style={{
              background: 'linear-gradient(to bottom, #ca8a04, transparent)',
            }}
          />
          {!isMobileCatchPanel && !revealItemId && (
            <>
              <div className="pointer-events-none absolute top-3 left-3 z-20 max-w-[44%]">
                <div className="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-500 px-3 py-1 font-black uppercase tracking-wider text-black shadow-sm -rotate-1 text-xs">
                  💎 Skattekiste
                </div>
              </div>
              {currentStreak > 0 && lastCatch.value > 0 && (
                <div className="pointer-events-none absolute top-3 right-3 z-20 max-w-[min(55%,16rem)]">
                  <div
                    className={`ml-auto inline-flex max-w-full items-center gap-1.5 rounded-2xl border px-3 py-1.5 font-black text-xs shadow-lg ${
                      currentStreak >= 5
                        ? 'anim-fire border-yellow-400 bg-orange-600/80 text-yellow-100'
                        : 'border-slate-500 bg-slate-700/80 text-slate-300'
                    }`}
                  >
                    <span className="flex-shrink-0">{currentStreak >= 5 ? '🔥' : '⚡'}</span>
                    <span className="min-w-0 text-left">
                      {currentStreak >= 5
                        ? `Perfekt streak: +${streakBonusShown} Rigdom`
                        : `Streak: ${currentStreak}`}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
          <div
            className={
              isMobileCatchPanel
                ? 'relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden'
                : 'relative z-10'
            }
          >
            <div
              className={
                isMobileCatchPanel
                  ? 'min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide'
                  : undefined
              }
            >
              {revealItemId ? (
                <div className="py-2">
                  <WardrobeUnlockCardPreview itemId={revealItemId} onTagMed={handleTagMed} />
                </div>
              ) : (
                <>
                  <div className="mb-4 flex justify-center">
                    <TreasureChestIllustration
                      className="block h-28 w-[calc(7rem*400/300)] shrink-0 md:h-32 md:w-[calc(8rem*400/300)]"
                      shaking={shaking}
                    />
                  </div>
                  <h2
                    className={`min-w-0 max-w-full break-words font-black leading-tight ${isMobileCatchPanel ? 'mb-2 text-3xl' : 'mb-2 pt-11 text-5xl'} ${rarityTextClass(lastCatch)}`}
                  >
                    {lastCatch.species}
                  </h2>
                  <div
                    className={`grid grid-cols-2 ${isMobileCatchPanel ? 'my-4 gap-2' : 'my-8 gap-4'}`}
                  >
                    <div
                      className={`rounded-2xl border border-white/5 ${isMobileCatchPanel ? 'p-3' : 'p-4'}`}
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <span
                        className={`mb-0.5 block font-bold text-slate-400 uppercase ${isMobileCatchPanel ? 'text-[0.65rem]' : 'mb-1 text-xs'}`}
                      >
                        Vægt
                      </span>
                      <span
                        className={`font-mono font-bold text-white ${isMobileCatchPanel ? 'text-lg' : 'text-2xl'}`}
                      >
                        {lastCatch.weight} kg
                      </span>
                    </div>
                    <div
                      className={`rounded-2xl border border-white/5 ${isMobileCatchPanel ? 'p-3' : 'p-4'}`}
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <span
                        className={`mb-0.5 block font-bold text-slate-400 uppercase ${isMobileCatchPanel ? 'text-[0.65rem]' : 'mb-1 text-xs'}`}
                      >
                        Værdi
                      </span>
                      <span
                        className={`font-mono font-bold text-yellow-400 ${isMobileCatchPanel ? 'text-lg' : 'text-2xl'}`}
                      >
                        {lastCatch.value} kr.
                      </span>
                    </div>
                    <div
                      className={`rounded-2xl border border-white/5 ${isMobileCatchPanel ? 'p-3' : 'p-4'}`}
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <span
                        className={`mb-0.5 block font-bold text-slate-400 uppercase ${isMobileCatchPanel ? 'text-[0.65rem]' : 'mb-1 text-xs'}`}
                      >
                        Held &amp; bonus
                      </span>
                      <div
                        className={`flex flex-wrap content-center justify-center gap-1 ${isMobileCatchPanel ? 'min-h-[1.5rem]' : 'min-h-[2.25rem]'}`}
                      >
                        {upgradeBadges.length > 0 ? (
                          upgradeBadges.map((b, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-0.5 rounded-full border font-bold leading-none"
                              style={{
                                padding: isMobileCatchPanel ? '0.15rem 0.4rem' : '0.2rem 0.55rem',
                                fontSize: isMobileCatchPanel ? '0.6rem' : '0.7rem',
                                background: 'rgba(0,0,0,0.35)',
                                borderColor: `${b.color}44`,
                                color: b.color,
                              }}
                            >
                              {b.icon} {b.text}
                            </span>
                          ))
                        ) : (
                          <span
                            className={`text-slate-500 ${isMobileCatchPanel ? 'text-[0.7rem]' : 'text-sm'}`}
                          >
                            Ingen
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`rounded-2xl border border-white/5 ${isMobileCatchPanel ? 'p-3' : 'p-4'}`}
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <span
                        className={`mb-0.5 block font-bold text-slate-400 uppercase ${isMobileCatchPanel ? 'text-[0.65rem]' : 'mb-1 text-xs'}`}
                      >
                        XP
                      </span>
                      {isMobileCatchPanel ? (
                        <span className="flex items-baseline justify-center gap-1 font-mono text-lg font-bold text-emerald-400">
                          <span aria-hidden>⭐</span>
                          <span>+{xpEarned}</span>
                        </span>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="flex items-center gap-1.5 font-mono text-2xl font-bold text-emerald-400">
                            <span aria-hidden>⭐</span>
                            <span>+{xpEarned} XP</span>
                          </span>
                          <span className="text-xs font-semibold text-emerald-300/90">optjent</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {moneyFlash !== null ? (
                <div className="mb-4 rounded-2xl border-2 border-amber-400/60 bg-amber-950/50 py-4 text-2xl font-black text-amber-200">
                  💰 +{moneyFlash} kr ekstra!
                </div>
              ) : null}
            </div>

            {revealItemId === null && moneyFlash === null ? (
              <button
                type="button"
                onClick={handleOpenChest}
                disabled={isOpening}
                className={`w-full rounded-2xl border-b-4 border-amber-800 bg-gradient-to-b from-amber-400 to-amber-600 font-black text-slate-900 shadow-xl transition-all enabled:hover:scale-[1.02] enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isMobileCatchPanel ? 'mt-3 flex-shrink-0 py-3 text-lg' : 'py-4 text-xl'
                }`}
              >
                {isOpening ? 'Åbner…' : 'Åbn kisten'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
