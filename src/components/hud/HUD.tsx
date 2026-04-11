import type { CSSProperties, ReactNode } from 'react';
import { getBucketTier } from '../../data/equipment';
import { GOALS } from '../../data/progression';
import { getLocation } from '../../data/locations';
import { getFinalStreakBonus } from '../../logic/xp-engine';
import { useAudio } from '../../audio/useAudio';
import { GoalNotification } from '../modals/GoalNotification';
import { useBucketDropStore } from '../../store/useBucketDropStore';
import { useGameStore } from '../../store/useGameStore';
import { useFishingStore } from '../../store/useFishingStore';
import { useMathStore } from '../../store/useMathStore';
import { useCollectionStore } from '../../store/useCollectionStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { ActiveMaddingBucketBadges } from './ActiveMaddingBucketBadges';
import { CoinDisplay } from './CoinDisplay';
import { inventoryBucketCount, isListedInBucketInventory } from '../../logic/bucket-inventory';
import { rarityTextClass } from './rarityColor';
import { StreakIndicator } from './StreakIndicator';
import { WeatherWidget } from './WeatherWidget';
import { XPBar } from './XPBar';

/**
 * Stor-skærm højremenu (`uiMode === 'desktop'`): `em` arver fra `.game-root` (fontSize % i App).
 * `max(px, em)` sikrer læsbarhed ved lav UI-skalering.
 */
const HUD_MENU_CLASS =
  'hud-menu-action touch-manipulation w-full rounded-2xl border-b-4 shadow-xl transition-all hover:scale-105 active:scale-95';

/** Kompakt højremenu kun i `uiMode === 'desktop'` (Fiskegrej · Kiste · Mål · Matematik). */
const HUD_DESKTOP_MENU_BTN_STYLE: CSSProperties = {
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'flex-start',
  textAlign: 'left',
  gap: '0.5rem',
  padding: '0.45rem 0.7rem',
  fontSize: 'max(13px, 1.05em)',
  fontWeight: 800,
  lineHeight: 1.25,
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  boxSizing: 'border-box',
};

const HUD_DESKTOP_MENU_ICON_STYLE: CSSProperties = {
  display: 'inline-flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'max(20px, 1.28em)',
  lineHeight: 1,
};

function hudGoalBadgeStyle(): CSSProperties {
  return {
    marginLeft: '0.35rem',
    borderRadius: '9999px',
    background: '#fff',
    padding: '0.2rem 0.55rem',
    fontWeight: 800,
    fontSize: 'max(13px, 0.92em)',
    color: '#a16207',
    fontVariantNumeric: 'tabular-nums',
  };
}

function hudDesktopGoalBadgeStyle(): CSSProperties {
  return {
    ...hudGoalBadgeStyle(),
    marginLeft: '0.25rem',
    padding: '0.12rem 0.42rem',
    fontSize: 'max(11px, 0.82em)',
  };
}

function HudDesktopMenuIcon({ children }: { children: ReactNode }) {
  return (
    <span style={HUD_DESKTOP_MENU_ICON_STYLE} aria-hidden>
      {children}
    </span>
  );
}

export function HUD() {
  const { play } = useAudio();
  const gameState = useGameStore((s) => s.gameState);
  const currentLocation = useGameStore((s) => s.currentLocation);
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

  const uiHidden = useUIStore((s) => s.uiHidden);
  const uiMode = useUIStore((s) => s.uiMode);
  const bucketOpen = useUIStore((s) => s.bucketOpen);
  const setBucketOpen = useUIStore((s) => s.setBucketOpen);
  const xpToast = useUIStore((s) => s.xpToast);
  const setShowKisteMenu = useUIStore((s) => s.setShowKisteMenu);
  const pendingGoal = useUIStore((s) => s.pendingGoal);
  const showLevelUp = useUIStore((s) => s.showLevelUp);

  const setShowMathSettings = useMathStore((s) => s.setShowMathSettings);

  const completedGoals = usePlayerStore((s) => s.completedGoals);
  const questItems = usePlayerStore((s) => s.questItems);
  const eggCountdown = usePlayerStore((s) => s.eggCountdown);
  const showTurtleEggHud =
    questItems.includes('turtle_egg') && !questItems.includes('turtle_hatched');
  const area = getLocation(currentLocation);
  const goalsDoneCount = completedGoals.length;

  const bucketTier = getBucketTier(upgrades);
  const fishInBucket = inventoryBucketCount(inventory);
  const bucketCapacity = bucketTier.capacity;
  const bucketFull = fishInBucket >= bucketCapacity;
  const totalInventoryValue = inventory.reduce((s, f) => s + (Number(f.value) || 0), 0);

  const sellStreakBonus = getFinalStreakBonus(currentStreak, zenMode, totalInventoryValue || 1);

  function sellAllFish() {
    const keep = inventory.filter(
      (f) => f.itemType === 'plesiosaur' || f.itemType === 'fossil' || f.itemType === 'conch',
    );
    const toSell = inventory.filter(
      (f) => f.itemType !== 'plesiosaur' && f.itemType !== 'fossil' && f.itemType !== 'conch',
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

  return (
    <>
      {!uiHidden && (
        <div className="pointer-events-none absolute top-16 right-0 left-0 z-30 text-center">
          <div className="mx-auto flex flex-col items-center gap-0.5">
            <h3 className="text-shadow-strong text-2xl font-black tracking-widest text-white uppercase">
              {area.emoji ?? '📍'} {area.name}
            </h3>
            {area.subtitle ? (
              <p
                className="text-shadow-strong text-sm font-semibold tracking-wide text-white/75"
                style={{ textTransform: 'none' }}
              >
                {area.subtitle}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <div
        className="pointer-events-none absolute top-0 right-0 left-0 z-30 flex items-start justify-between px-4"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
      >
      <div
        className="pointer-events-auto flex flex-col gap-2"
        style={{ width: '14rem', minWidth: '14rem', maxWidth: '14rem' }}
      >
        <h1
          className="text-shadow-soft text-center font-black tracking-tighter text-white italic select-none"
          style={{
            pointerEvents: 'none',
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            marginTop: '0.25rem',
            marginBottom: '0.25rem',
          }}
        >
          RegneFisken
        </h1>

        {!uiHidden && uiMode === 'desktop' && (
          <div className="mt-1 flex w-full flex-col gap-2">
            <WeatherWidget />
            <div className="relative w-full">
              <XPBar />
              {xpToast && (
                <div
                  className="xp-toast-hud pointer-events-none absolute top-1/2 left-full z-10 ml-2 -translate-y-1/2 rounded-xl font-black whitespace-nowrap text-emerald-300"
                  style={{
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(8px)',
                    animation: 'xpToastPop 0.2s ease-out forwards',
                  }}
                >
                  {xpToast}
                </div>
              )}
            </div>
            <CoinDisplay />
            {showTurtleEggHud && !!eggCountdown && (
              <div
                className="panel-hud mb-1 flex w-full items-center justify-center gap-2 rounded-2xl border px-3 py-2 shadow-xl"
                style={{ borderColor: '#334155' }}
              >
                <span className="text-xl leading-none">🥚</span>
                <span className="text-lg leading-none">⏳</span>
                <span
                  className="font-mono text-[1.05rem] font-black tabular-nums"
                  style={{ color: '#fde68a' }}
                >
                  {eggCountdown}
                </span>
              </div>
            )}
            <div
              className="panel-hud flex w-full flex-col gap-2 rounded-2xl border p-3 shadow-xl"
              style={{ borderColor: bucketFull ? '#ef4444' : '#334155' }}
            >
              <button
                type="button"
                onClick={() => {
                  play('ui');
                  setBucketOpen(!bucketOpen);
                }}
                className="mb-1 flex w-full items-center justify-between border-b border-slate-700 pb-2"
              >
                <span
                  className="flex items-center gap-1 text-xs font-bold tracking-wider uppercase"
                  style={{ color: bucketFull ? '#f87171' : '#94a3b8' }}
                >
                  {bucketTier.icon ?? '🪣'} {bucketTier.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-yellow-500">{totalInventoryValue} kr.</span>
                  <span className="text-xs text-slate-400">{bucketOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              <div className="flex items-center gap-2 pb-1">
                <div className="h-1.5 flex-1 rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (fishInBucket / bucketCapacity) * 100)}%`,
                      background:
                        bucketFull ? '#ef4444' : fishInBucket / bucketCapacity > 0.7 ? '#f59e0b' : '#22c55e',
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
              {bucketOpen && (
                <div className="scrollbar-hide max-h-[260px] space-y-2 overflow-y-auto text-xs">
                  {inventory.length === 0 && (
                    <span className="block py-4 text-center text-slate-500 italic opacity-50">
                      Tom spand...
                    </span>
                  )}
                  {inventory
                    .filter((f) => isListedInBucketInventory(f))
                    .map((fish) => (
                      <div
                        key={fish.id}
                        className="flex items-center justify-between gap-2 rounded-xl border p-2.5"
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
              )}
              {inventory.some((f) => isListedInBucketInventory(f)) && gameState === 'idle' && (
                <button
                  type="button"
                  onClick={sellAllFish}
                  className="touch-manipulation flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-600 py-2 text-xs font-bold tracking-wider text-white uppercase shadow-lg transition-all hover:bg-yellow-500 active:scale-95"
                >
                  💵 Sælg Alt ({totalInventoryValue + sellStreakBonus} kr)
                </button>
              )}
            </div>
            <ActiveMaddingBucketBadges />
            <StreakIndicator />
          </div>
        )}
      </div>

      {!uiHidden && uiMode === 'desktop' && (
        <div
          className="pointer-events-auto absolute top-0 right-4 z-30 flex flex-col items-end gap-2"
          style={{
            width: 'min(11.25rem, 28vw)',
            marginTop: 'max(1.8rem, calc(0.25rem + env(safe-area-inset-top, 0px)))',
          }}
        >
          {gameState === 'idle' && (
            <>
              <button
                type="button"
                onClick={() => {
                  play('ui');
                  setShopInitialTab('fishing_gear');
                  setGameState('shop');
                }}
                className={`${HUD_MENU_CLASS} border-green-800 bg-green-600 text-white hover:bg-green-500`}
                style={HUD_DESKTOP_MENU_BTN_STYLE}
              >
                <HudDesktopMenuIcon>🛒</HudDesktopMenuIcon>
                Fiskegrej
              </button>
              <button
                type="button"
                onClick={() => {
                  play('ui');
                  setShowKisteMenu(true);
                }}
                className={`${HUD_MENU_CLASS} border-[#78350f]`}
                style={{
                  ...HUD_DESKTOP_MENU_BTN_STYLE,
                  background: 'linear-gradient(135deg, #b45309, #92400e)',
                  color: '#fef3c7',
                }}
              >
                <HudDesktopMenuIcon>🗃️</HudDesktopMenuIcon>
                Kiste
              </button>
              <button
                type="button"
                onClick={() => {
                  play('ui');
                  setGameState('goals');
                }}
                className={`${HUD_MENU_CLASS} relative border-yellow-800 bg-yellow-600 text-white hover:bg-yellow-500`}
                style={HUD_DESKTOP_MENU_BTN_STYLE}
              >
                <HudDesktopMenuIcon>🏆</HudDesktopMenuIcon>
                Mål
                <span style={hudDesktopGoalBadgeStyle()}>
                  {goalsDoneCount}/{GOALS.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  play('ui');
                  setShowMathSettings(true);
                }}
                className={`${HUD_MENU_CLASS} border-indigo-800 bg-indigo-600 text-white hover:bg-indigo-500`}
                style={HUD_DESKTOP_MENU_BTN_STYLE}
              >
                <HudDesktopMenuIcon>🧮</HudDesktopMenuIcon>
                Matematik
              </button>
            </>
          )}
          {pendingGoal && showLevelUp == null && <GoalNotification />}
        </div>
      )}
    </div>

      {/* SÆLG ALT HURTIGKNAP — legacy-game.html ~13036 (fast centreret bund) */}
      {inventory.some(
        (f) => f.itemType !== 'plesiosaur' && (Number(f.value) || 0) > 0,
      ) &&
        gameState === 'idle' && (
          <button
            type="button"
            onClick={sellAllFish}
            title={`Sælg alle fisk (${totalInventoryValue + sellStreakBonus} kr)`}
            className="touch-manipulation fixed left-1/2 z-[9999] flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-2xl border-[1.5px] border-amber-400/60 px-5 py-2.5 font-black whitespace-nowrap text-amber-100 shadow-lg select-none transition-[transform,box-shadow] duration-100 hover:scale-[1.06] hover:shadow-xl active:translate-y-[3px] active:scale-[0.97]"
            style={{
              bottom: 'max(9rem, calc(7rem + env(safe-area-inset-bottom, 0px)))',
              background: 'linear-gradient(135deg, rgba(161,98,7,0.97), rgba(120,65,0,0.97))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              fontSize: 'max(15px, 0.95rem)',
              lineHeight: 1,
              boxShadow: '0 4px 20px rgba(161,98,7,0.6)',
              animation: bucketFull ? 'baitPulse 1.5s ease-in-out infinite' : 'none',
            }}
          >
            <span className="text-lg" aria-hidden>
              💵
            </span>
            <span className="tracking-wide">
              Sælg alt · {totalInventoryValue + sellStreakBonus} kr.
            </span>
            {sellStreakBonus > 0 && (
              <span className="text-[0.72rem] font-black text-red-300">🔥+{sellStreakBonus}</span>
            )}
          </button>
        )}
    </>
  );
}
