import { getBucketTier } from '../../data/equipment';
import { getFinalStreakBonus } from '../../logic/xp-engine';
import { useAudio } from '../../audio/useAudio';
import { useGameStore } from '../../store/useGameStore';
import { useFishingStore } from '../../store/useFishingStore';
import { useMathStore } from '../../store/useMathStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { CoinDisplay } from './CoinDisplay';
import { rarityTextClass } from './rarityColor';
import { StreakIndicator } from './StreakIndicator';
import { WeatherWidget } from './WeatherWidget';
import { XPBar } from './XPBar';

export function HUD() {
  const { play } = useAudio();
  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);
  const setShopInitialTab = useGameStore((s) => s.setShopInitialTab);

  const inventory = usePlayerStore((s) => s.inventory);
  const coins = usePlayerStore((s) => s.coins);
  const upgrades = usePlayerStore((s) => s.upgrades);
  const setCoins = usePlayerStore((s) => s.setCoins);
  const setInventory = usePlayerStore((s) => s.setInventory);
  const setStats = usePlayerStore((s) => s.setStats);

  const currentStreak = useFishingStore((s) => s.currentStreak);

  const zenMode = useMathStore((s) => s.zenMode);

  const hideDesktopUI = useUIStore((s) => s.hideDesktopUI);
  const uiMode = useUIStore((s) => s.uiMode);
  const bucketOpen = useUIStore((s) => s.bucketOpen);
  const setBucketOpen = useUIStore((s) => s.setBucketOpen);
  const xpToast = useUIStore((s) => s.xpToast);
  const setShowKisteMenu = useUIStore((s) => s.setShowKisteMenu);
  const setShowScreenSettings = useUIStore((s) => s.setShowScreenSettings);

  const setShowMathSettings = useMathStore((s) => s.setShowMathSettings);

  const bucketTier = getBucketTier(upgrades);
  const fishInBucket = inventory.filter((f) => f.itemType !== 'plesiosaur').length;
  const bucketCapacity = bucketTier.capacity;
  const bucketFull = fishInBucket >= bucketCapacity;
  const totalInventoryValue = inventory.reduce((s, f) => s + (Number(f.value) || 0), 0);

  const sellStreakBonus = getFinalStreakBonus(currentStreak, zenMode, totalInventoryValue || 1);

  function sellAllFish() {
    const keep = inventory.filter((f) => f.itemType === 'plesiosaur');
    const toSell = inventory.filter((f) => f.itemType !== 'plesiosaur');
    if (toSell.length === 0) return;
    play('coin');
    const total = toSell.reduce((s, f) => s + (Number(f.value) || 0), 0);
    const bonus = getFinalStreakBonus(currentStreak, zenMode, total || 1);
    setCoins((c) => c + total + bonus);
    setInventory(keep);
    setStats((s) => ({
      ...s,
      totalSold: s.totalSold + toSell.length,
      totalEarned: s.totalEarned + total + bonus,
    }));
  }

  return (
    <div
      className="pointer-events-none absolute top-0 right-0 left-0 z-30 flex justify-between px-4"
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

        {!hideDesktopUI && uiMode === 'desktop' && (
          <div className="mt-1 flex w-full flex-col gap-2">
            <WeatherWidget />
            <div className="relative w-full">
              <XPBar />
              {xpToast && (
                <div
                  className="pointer-events-none absolute top-1/2 left-full z-10 ml-2 -translate-y-1/2 rounded-xl px-3 py-1 text-sm font-black text-emerald-300 whitespace-nowrap"
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
                    .filter((f) => f.itemType !== 'plesiosaur')
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
              {inventory.some((f) => f.itemType !== 'plesiosaur') && gameState === 'idle' && (
                <button
                  type="button"
                  onClick={sellAllFish}
                  className="touch-manipulation flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-600 py-2 text-xs font-bold tracking-wider text-white uppercase shadow-lg transition-all hover:bg-yellow-500 active:scale-95"
                >
                  💵 Sælg Alt ({totalInventoryValue + sellStreakBonus} kr)
                </button>
              )}
            </div>
            <StreakIndicator />
          </div>
        )}

        {gameState === 'idle' && (
          <div className="mt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                play('ui');
                setShopInitialTab('fishing_gear');
                setGameState('shop');
              }}
              className="touch-manipulation rounded-xl bg-emerald-700 py-2 text-xs font-bold text-white uppercase shadow-lg hover:bg-emerald-600"
            >
              🛒 Butik
            </button>
            <button
              type="button"
              onClick={() => {
                play('ui');
                setGameState('goals');
              }}
              className="touch-manipulation rounded-xl bg-amber-700 py-2 text-xs font-bold text-white uppercase shadow-lg hover:bg-amber-600"
            >
              🏆 Mål
            </button>
            <button
              type="button"
              onClick={() => {
                play('ui');
                setShowKisteMenu(true);
              }}
              className="touch-manipulation rounded-xl bg-slate-700 py-2 text-xs font-bold text-white uppercase shadow-lg hover:bg-slate-600"
            >
              📦 Kiste
            </button>
            <button
              type="button"
              onClick={() => {
                play('ui');
                setGameState('journal');
              }}
              className="touch-manipulation rounded-xl bg-sky-800 py-2 text-xs font-bold text-white uppercase shadow-lg hover:bg-sky-700"
            >
              📖 Journal
            </button>
            <button
              type="button"
              onClick={() => {
                play('ui');
                setShowMathSettings(true);
              }}
              className="touch-manipulation rounded-xl bg-indigo-800 py-2 text-xs font-bold text-white uppercase shadow-lg hover:bg-indigo-700"
            >
              🔢 Regnestykker
            </button>
            <button
              type="button"
              onClick={() => {
                play('ui');
                setShowScreenSettings(true);
              }}
              className="touch-manipulation rounded-xl bg-cyan-900 py-2 text-xs font-bold text-white uppercase shadow-lg hover:bg-cyan-800"
            >
              ⚙️ Skærm
            </button>
          </div>
        )}
      </div>

      <div className="pointer-events-auto flex flex-col items-end gap-2 pt-1">
        <span className="text-xs font-bold text-slate-500">{coins} kr.</span>
      </div>
    </div>
  );
}
