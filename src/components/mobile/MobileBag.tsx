import { useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '../../audio/useAudio';
import { getBucketTier } from '../../data/equipment';
import { getFinalStreakBonus } from '../../logic/xp-engine';
import { inventoryBucketCount, isListedInBucketInventory } from '../../logic/bucket-inventory';
import { useBucketDropStore } from '../../store/useBucketDropStore';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useFishingStore } from '../../store/useFishingStore';
import { useGameStore } from '../../store/useGameStore';
import { useMathStore } from '../../store/useMathStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import type { BagTab } from '../../store/useUIStore';
import { useUIStore } from '../../store/useUIStore';
import { BaitTab } from '../chest/BaitTab';
import { EquipmentTab } from '../chest/EquipmentTab';
import { KisteTuningTab } from '../chest/KisteTuningTab';
import { PetTab } from '../chest/PetTab';
import { TreasureTab } from '../chest/TreasureTab';
import { MobileGoalsTab } from '../goals/MobileGoalsTab';
import { ActiveMaddingBucketBadges } from '../hud/ActiveMaddingBucketBadges';
import { rarityTextClass } from '../hud/rarityColor';
import { WeatherWidget } from '../hud/WeatherWidget';
import { XPBar } from '../hud/XPBar';

export function MobileBag() {
  const { play } = useAudio();
  const isBagOpen = useUIStore((s) => s.isBagOpen);
  const setIsBagOpen = useUIStore((s) => s.setIsBagOpen);
  const bagTab = useUIStore((s) => s.bagTab);
  const setBagTab = useUIStore((s) => s.setBagTab);
  const uiMode = useUIStore((s) => s.uiMode);
  const setShowScreenSettings = useUIStore((s) => s.setShowScreenSettings);
  const kisteTab = useUIStore((s) => s.kisteTab);
  const setKisteTab = useUIStore((s) => s.setKisteTab);

  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);
  const setShopInitialTab = useGameStore((s) => s.setShopInitialTab);

  const inventory = usePlayerStore((s) => s.inventory);
  const upgrades = usePlayerStore((s) => s.upgrades);
  const setCoins = usePlayerStore((s) => s.setCoins);
  const setInventory = usePlayerStore((s) => s.setInventory);
  const setStats = usePlayerStore((s) => s.setStats);

  const currentStreak = useFishingStore((s) => s.currentStreak);
  const setCurrentStreak = useFishingStore((s) => s.setCurrentStreak);
  const setStreakMilestoneToast = useFishingStore((s) => s.setStreakMilestoneToast);

  const zenMode = useMathStore((s) => s.zenMode);
  const setShowMathSettings = useMathStore((s) => s.setShowMathSettings);

  const hasPirateHat = usePlayerStore((s) => s.upgrades.includes('pirate_hat'));

  const bucketTier = getBucketTier(upgrades);
  const fishInBucket = inventoryBucketCount(inventory);
  const bucketCapacity = bucketTier.capacity;
  const bucketFull = fishInBucket >= bucketCapacity;
  const totalInventoryValue = inventory.reduce((s, f) => s + (Number(f.value) || 0), 0);
  const sellStreakBonus = getFinalStreakBonus(currentStreak, zenMode, totalInventoryValue || 1);

  const kisteTabs = useMemo(() => {
    const base = [
      { id: 'udstyr', label: '🛠️ Udstyr' },
      { id: 'madding', label: '⚡ Aktive buffs' },
      { id: 'companions', label: '🐢 Kæledyr' },
      { id: 'skatte', label: '💎 Skatte & Quest' },
    ] as const;
    if (!hasPirateHat) return [...base];
    return [...base, { id: 'tuning', label: '🔧 Tuning' } as const];
  }, [hasPirateHat]);

  const bagTabs: { id: BagTab; label: string }[] = [
    { id: 'menu', label: '📋 Menu' },
    { id: 'spand', label: `${bucketTier.icon ?? '🪣'} Spand` },
    { id: 'kiste', label: '🗃️ Kiste' },
    { id: 'maal', label: '🏆 Mål' },
  ];

  function sellAllFish() {
    const keep = inventory.filter(
      (f) =>
        f.itemType === 'plesiosaur' ||
        f.itemType === 'fossil' ||
        f.itemType === 'conch' ||
        f.itemType === 'sardine' ||
        f.itemType === 'crystal_junk',
    );
    const toSell = inventory.filter(
      (f) =>
        f.itemType !== 'plesiosaur' &&
        f.itemType !== 'fossil' &&
        f.itemType !== 'conch' &&
        f.itemType !== 'sardine' &&
        f.itemType !== 'crystal_junk',
    );
    if (toSell.length === 0) return;
    const pearlsSold = toSell.filter((f) => f.itemType === 'pearl').length;
    if (pearlsSold > 0) {
      useCollectionStore.getState().setCollectibleInventory((c) => ({
        ...c,
        pearlCount: Math.max(0, c.pearlCount - pearlsSold),
      }));
    }
    play('coin');
    const total = toSell.reduce((s, f) => s + (Number(f.value) || 0), 0);
    const bonus = getFinalStreakBonus(currentStreak, zenMode, total || 1);
    const legendaryThisSale = toSell.filter((f) => f.rarity === 'Legendarisk').length;
    setCoins((c) => c + total + bonus);
    setInventory(keep);
    setStats((s) => ({
      ...s,
      totalSold: s.totalSold + toSell.length,
      totalEarned: s.totalEarned + total + bonus,
      legendarySold: s.legendarySold + legendaryThisSale,
    }));
    setCurrentStreak(0);
    setStreakMilestoneToast(null);
    useBucketDropStore.getState().clearAllBucketVisuals();
  }

  const swipeAreaRef = useRef<HTMLDivElement>(null);
  const [sheetOffsetY, setSheetOffsetY] = useState(0);
  const sheetOffsetRef = useRef(0);
  const dragStartY = useRef(0);
  const dragging = useRef(false);
  const moveRaf = useRef<number | null>(null);

  useEffect(() => {
    sheetOffsetRef.current = sheetOffsetY;
  }, [sheetOffsetY]);

  useEffect(() => {
    if (isBagOpen && uiMode === 'mobile') {
      setSheetOffsetY(0);
      sheetOffsetRef.current = 0;
    }
  }, [isBagOpen, uiMode]);

  useEffect(() => {
    const el = swipeAreaRef.current;
    if (!el || !isBagOpen || uiMode !== 'mobile') return;

    const clearMoveRaf = () => {
      if (moveRaf.current != null) {
        cancelAnimationFrame(moveRaf.current);
        moveRaf.current = null;
      }
    };

    const animateOffsetTo = (target: number, durationMs: number) => {
      const from = sheetOffsetRef.current;
      if (from === target) return;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / durationMs);
        const eased = 1 - (1 - p) ** 2;
        const v = from + (target - from) * eased;
        sheetOffsetRef.current = v;
        setSheetOffsetY(v);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      dragStartY.current = e.touches[0].clientY;
      dragging.current = true;
      clearMoveRaf();
    };

    const onMove = (e: TouchEvent) => {
      if (!dragging.current || e.touches.length !== 1) return;
      const dy = Math.max(0, e.touches[0].clientY - dragStartY.current);
      if (dy > 0) e.preventDefault();
      clearMoveRaf();
      moveRaf.current = requestAnimationFrame(() => {
        moveRaf.current = null;
        sheetOffsetRef.current = dy;
        setSheetOffsetY(dy);
      });
    };

    const onEnd = () => {
      clearMoveRaf();
      if (!dragging.current) return;
      dragging.current = false;
      const y = sheetOffsetRef.current;
      if (y > 100) {
        play('ui');
        setSheetOffsetY(0);
        sheetOffsetRef.current = 0;
        setIsBagOpen(false);
        return;
      }
      animateOffsetTo(0, 220);
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
      clearMoveRaf();
    };
  }, [isBagOpen, uiMode, play, setIsBagOpen]);

  if (!isBagOpen || uiMode !== 'mobile') return null;

  return (
    <div
      role="presentation"
      className="pointer-events-auto fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onClick={() => setIsBagOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setIsBagOpen(false)}
    >
      <div
        className="pointer-events-auto w-[94%] max-w-[520px] will-change-transform"
        style={{ transform: `translateY(${sheetOffsetY}px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          role="dialog"
          aria-modal
          aria-label="Fisketaske"
          className="panel-dark anim-zoom-in flex h-[clamp(440px,75dvh,720px)] min-h-0 w-full flex-col overflow-hidden rounded-3xl border-2 border-sky-400/35 p-6 pt-4 shadow-2xl"
          style={{
            boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(56,189,248,0.08)',
          }}
        >
          <div className="shrink-0">
            <div
              ref={swipeAreaRef}
              className="touch-manipulation flex flex-col items-center pb-3"
              style={{ touchAction: 'none' }}
            >
              <div
                className="mb-3 h-1.5 w-14 shrink-0 rounded-full bg-white/30"
                aria-hidden
              />
              <div className="flex w-full items-center justify-between">
                <h3 className="text-[1.2rem] font-black text-white">🎒 Fisketaske</h3>
                <button
                  type="button"
                  onClick={() => {
                    play('ui');
                    setIsBagOpen(false);
                  }}
                  className="touch-manipulation inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center border-none bg-transparent leading-none text-[#94a3b8] text-[1.5rem] hover:text-white"
                  aria-label="Luk"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="scrollbar-hide mb-3.5 flex gap-1.5 overflow-x-auto">
              {bagTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    play('ui');
                    setBagTab(tab.id);
                  }}
                  className="touch-manipulation"
                  style={{
                    flexShrink: 0,
                    minHeight: 44,
                    minWidth: 44,
                    padding: '0.5rem 0.9rem',
                    borderRadius: '0.75rem',
                    border:
                      bagTab === tab.id
                        ? '2px solid #38bdf8'
                        : '1px solid rgba(255,255,255,0.1)',
                    background:
                      bagTab === tab.id ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
                    color: bagTab === tab.id ? '#38bdf8' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                    alignItems: 'center',
                    display: 'inline-flex',
                    justifyContent: 'center',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="screen-settings-legacy-scroll min-h-0 flex-1 overflow-y-auto pr-0.5 pb-1">
            {bagTab === 'menu' && (
            <div className="flex flex-col gap-3">
              {gameState === 'idle' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      play('ui');
                      setIsBagOpen(false);
                      setShopInitialTab('fishing_gear');
                      setGameState('shop');
                    }}
                    className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-green-500/50 p-4 text-left font-bold text-[1rem]"
                    style={{
                      background: 'rgba(22,163,74,0.15)',
                      color: '#86efac',
                    }}
                  >
                    <span className="text-2xl">🛒</span>
                    Butik
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      play('ui');
                      setIsBagOpen(false);
                      setShowMathSettings(true);
                    }}
                    className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-indigo-500/50 p-4 text-left font-bold text-[1rem]"
                    style={{
                      background: 'rgba(79,70,229,0.15)',
                      color: '#c4b5fd',
                    }}
                  >
                    <span className="text-2xl">🧮</span>
                    Matematik
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  play('ui');
                  setIsBagOpen(false);
                  setShowScreenSettings(true);
                }}
                className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-slate-500/40 p-4 text-left font-bold text-[1rem]"
                style={{
                  background: 'rgba(51,65,85,0.4)',
                  color: '#cbd5e1',
                }}
              >
                <span className="text-2xl">⚙️</span>
                Skærmindstillinger
              </button>

              <div className="mt-1 flex w-full flex-col gap-3 border-t border-slate-600/40 pt-4">
                <XPBar />
                <WeatherWidget variant="bag" />
              </div>
            </div>
          )}

          {bagTab === 'spand' && (
            <div className="flex flex-col gap-3">
              <div
                className="flex flex-col gap-2 rounded-2xl border p-3"
                style={{ borderColor: bucketFull ? '#ef4444' : '#334155' }}
              >
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span
                    className="flex items-center gap-1 text-xs font-bold tracking-wider uppercase"
                    style={{ color: bucketFull ? '#f87171' : '#94a3b8' }}
                  >
                    {bucketTier.icon ?? '🪣'} {bucketTier.name}
                  </span>
                  <span className="font-mono text-xs text-yellow-500">{totalInventoryValue} kr.</span>
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (fishInBucket / bucketCapacity) * 100)}%`,
                        background:
                          bucketFull
                            ? '#ef4444'
                            : fishInBucket / bucketCapacity > 0.7
                              ? '#f59e0b'
                              : '#22c55e',
                      }}
                    />
                  </div>
                  <span
                    className="font-mono text-xs"
                    style={{ color: bucketFull ? '#f87171' : '#94a3b8' }}
                  >
                    {fishInBucket}/{bucketCapacity}
                  </span>
                </div>
                {bucketFull && (
                  <div className="animate-pulse py-0.5 text-center text-xs font-bold text-red-400">
                    ⛔ Spanden er fuld!
                  </div>
                )}
                <div className="scrollbar-hide max-h-[38dvh] space-y-2 overflow-y-auto text-xs">
                  {inventory.length === 0 && (
                    <span className="block py-6 text-center text-slate-500 italic opacity-50">
                      Tom spand...
                    </span>
                  )}
                  {inventory
                    .filter((f) => isListedInBucketInventory(f))
                    .map((fish) => (
                      <div
                        key={fish.id}
                        className="flex items-center justify-between gap-2 rounded-xl border p-2"
                        style={{
                          background: 'rgba(30,41,59,0.5)',
                          borderColor: 'rgba(51,65,85,0.5)',
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            className={`truncate font-bold ${rarityTextClass(fish)}`}
                            title={fish.species}
                          >
                            {fish.species}
                          </div>
                          <div className="text-xs text-slate-500">{fish.weight} kg</div>
                        </div>
                        <div className="shrink-0 font-mono text-xs font-bold text-yellow-500">
                          +{fish.value}
                        </div>
                      </div>
                    ))}
                </div>
                {inventory.some((f) => isListedInBucketInventory(f)) && gameState === 'idle' && (
                  <button
                    type="button"
                    onClick={() => {
                      play('coin');
                      sellAllFish();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-600 py-2.5 text-xs font-bold tracking-wider text-white uppercase shadow-lg"
                  >
                    💵 Sælg Alt ({totalInventoryValue + sellStreakBonus} kr)
                  </button>
                )}
              </div>
              <ActiveMaddingBucketBadges />
            </div>
          )}

          {bagTab === 'kiste' && (
            <div className="flex flex-col gap-2">
              <div className="scrollbar-hide flex gap-1 overflow-x-auto pb-1">
                {kisteTabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    title={t.label}
                    onClick={() => {
                      play('ui');
                      setKisteTab(t.id);
                    }}
                    className="touch-manipulation min-h-[44px] min-w-0 shrink-0 cursor-pointer rounded-xl font-bold transition-all duration-150"
                    style={{
                      flex: '1 1 5rem',
                      padding: '0.45rem 0.5rem',
                      whiteSpace: 'nowrap',
                      fontSize: '0.72rem',
                      border:
                        kisteTab === t.id
                          ? '2px solid #b45309'
                          : '1px solid rgba(255,255,255,0.1)',
                      background:
                        kisteTab === t.id ? 'rgba(180,83,9,0.25)' : 'rgba(255,255,255,0.04)',
                      color: kisteTab === t.id ? '#fde68a' : '#94a3b8',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
                {kisteTab === 'udstyr' && <EquipmentTab />}
                {kisteTab === 'madding' && <BaitTab />}
                {kisteTab === 'companions' && <PetTab />}
                {kisteTab === 'skatte' && <TreasureTab />}
                {kisteTab === 'tuning' && hasPirateHat && <KisteTuningTab />}
              </div>
            </div>
          )}

          {bagTab === 'maal' && <MobileGoalsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
