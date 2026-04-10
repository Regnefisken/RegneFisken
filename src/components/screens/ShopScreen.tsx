import { useEffect, useState } from 'react';
import { useAudio } from '../../audio/useAudio';
import { ARCTIC_SET, DESERT_SET } from '../../data/progression';
import { LOCATIONS } from '../../data/locations';
import {
  FURNITURE_SHOP_ITEMS,
  type FurnitureShopItem,
  type RoomId,
} from '../../data/furnitureShopItems';
import { SHOP_ITEMS } from '../../data/shop';
import type { ShopItem } from '../../types/shop';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { CoinIcon } from '../common/CoinIcon';

type ItemStatus = 'owned' | 'locked' | 'quest_locked' | 'upgrade_locked' | 'broke' | 'available';

function getItemStatus(
  item: ShopItem,
  ctx: {
    coins: number;
    upgrades: string[];
    level: number;
    questItems: string[];
    cheeseSources: string[];
    featherSources: string[];
  }
): ItemStatus {
  if (item.id === 'cheese_bought' && ctx.cheeseSources.includes('shop')) return 'owned';
  if (item.id === 'feather_bought') {
    if (ctx.featherSources.includes('shop')) return 'owned';
    if (ctx.featherSources.length >= 3) return 'owned';
  }
  if (ctx.upgrades.includes(item.id) && !item.consumable) return 'owned';
  if (ctx.level < item.requiredLevel) return 'locked';
  if (item.requiresQuestItem && !ctx.questItems.includes(item.requiresQuestItem)) return 'quest_locked';
  if (item.requiresUpgrade && !ctx.upgrades.includes(item.requiresUpgrade)) return 'upgrade_locked';
  if (ctx.coins < item.cost) return 'broke';
  return 'available';
}

function getAreaUnlock(item: ShopItem) {
  return Object.values(LOCATIONS).find((a) => a.requiresItem === item.id) ?? null;
}

/** Bestemt form efter "tilføjet til …" (jf. FASE 5-guide). */
const FURNITURE_ROOM_TOAST: Record<RoomId, string> = {
  living: 'stuen',
  kitchen: 'køkkenet',
  bedroom: 'soveværelset',
};

const FURNITURE_SHOP_COUNT = FURNITURE_SHOP_ITEMS.length;

function isFurnitureRoomComplete(room: RoomId, unlockedFurniture: string[]): boolean {
  const inRoom = FURNITURE_SHOP_ITEMS.filter((i) => i.room === room);
  return inRoom.length > 0 && inRoom.every((i) => unlockedFurniture.includes(i.id));
}

const furnitureRoomTabs: { id: RoomId; label: string }[] = [
  { id: 'living', label: '🛋️ Stue' },
  { id: 'kitchen', label: '🍳 Køkken' },
  { id: 'bedroom', label: '🛏️ Soveværelse' },
];

function getFurnitureBuyStatus(
  item: FurnitureShopItem,
  coins: number,
  unlockedFurniture: string[],
): 'owned' | 'broke' | 'available' {
  if (unlockedFurniture.includes(item.id)) return 'owned';
  if (coins < item.price) return 'broke';
  return 'available';
}

function applyConsumable(item: ShopItem) {
  const p = usePlayerStore.getState();
  const ms = (item.duration ?? 600) * 1000;
  const until = Date.now() + ms;
  switch (item.id) {
    case 'bait_conch':
      p.setConchBaitExpiry(until);
      break;
    case 'bait_fossil':
      p.setFossilBaitExpiry(until);
      break;
    case 'bait_fly':
      p.setFlyBaitExpiry(until);
      break;
    case 'haj_blod':
      p.setHajBloodExpiry(until);
      break;
    case 'perle_lim':
      p.setPerleLimExpiry(until);
      break;
    case 'legendary_bait':
      p.setActiveBait('legendary_bait');
      break;
    default:
      break;
  }
}

export function ShopScreen() {
  const { play } = useAudio();
  const setGameState = useGameStore((s) => s.setGameState);
  const shopInitialTab = useGameStore((s) => s.shopInitialTab);
  const setShopInitialTab = useGameStore((s) => s.setShopInitialTab);

  const coins = usePlayerStore((s) => s.coins);
  const upgrades = usePlayerStore((s) => s.upgrades);
  const questItems = usePlayerStore((s) => s.questItems);
  const cheeseSources = usePlayerStore((s) => s.cheeseSources);
  const setCheeseSources = usePlayerStore((s) => s.setCheeseSources);
  const featherSources = usePlayerStore((s) => s.featherSources);
  const setFeatherSources = usePlayerStore((s) => s.setFeatherSources);
  const level = usePlayerStore((s) => s.progression.level);
  const setCoins = usePlayerStore((s) => s.setCoins);
  const setUpgrades = usePlayerStore((s) => s.setUpgrades);
  const setQuestItems = usePlayerStore((s) => s.setQuestItems);
  const setStats = usePlayerStore((s) => s.setStats);
  const unlockedFurniture = usePlayerStore((s) => s.unlockedFurniture);
  const unlockFurniture = usePlayerStore((s) => s.unlockFurniture);

  const setToastMessage = useUIStore((s) => s.setToastMessage);

  const furniturePurchasedCount = FURNITURE_SHOP_ITEMS.filter((i) =>
    unlockedFurniture.includes(i.id),
  ).length;

  const [activeTab, setActiveTab] = useState(shopInitialTab || 'fishing_gear');
  const [activeFurnitureRoom, setActiveFurnitureRoom] = useState<RoomId>('living');

  const cabinUnlocked = upgrades.includes('magnet') && questItems.includes('cabin_key');

  useEffect(() => {
    if (shopInitialTab) setActiveTab(shopInitialTab);
  }, [shopInitialTab]);

  const furnitureTabDisplayLabel = `🏠 Møbler — ${furniturePurchasedCount}/${FURNITURE_SHOP_COUNT} købt`;

  const shopTabs = [
    {
      id: 'fishing_gear',
      label: '🎣 Fiskegrej',
      items: SHOP_ITEMS.filter((i) => i.category === 'fishing_gear'),
    },
    { id: 'bait', label: '🪱 Madding', items: SHOP_ITEMS.filter((i) => i.category === 'bait') },
    {
      id: 'travel',
      label: '🗺️ Rejser & Adgang',
      items: SHOP_ITEMS.filter((i) => i.category === 'travel'),
    },
    {
      id: 'legendary',
      label: '✨ Legendarisk',
      items: SHOP_ITEMS.filter((i) => i.category === 'legendary'),
    },
    { id: 'furniture', label: furnitureTabDisplayLabel, items: [] as ShopItem[] },
  ];

  const currentItems = shopTabs.find((t) => t.id === activeTab)?.items ?? [];

  const desertOwned = DESERT_SET.filter((id) => upgrades.includes(id)).length;
  const arcticOwned = ARCTIC_SET.filter((id) => upgrades.includes(id)).length;
  const hasDesertSet = desertOwned === 4;
  const hasArcticSet = arcticOwned === 4;

  function onClose() {
    play('ui');
    setGameState('idle');
    setShopInitialTab('fishing_gear');
  }

  function onBuy(itemId: string) {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    const status = getItemStatus(item, {
      coins,
      upgrades,
      level,
      questItems,
      cheeseSources,
      featherSources,
    });
    if (status !== 'available') {
      play('error');
      return;
    }

    play('purchase');
    if (item.cost > 0) {
      setCoins((c) => c - item.cost);
    }
    setStats((s) => ({ ...s, upgradesBought: s.upgradesBought + 1 }));

    if (item.consumable) {
      applyConsumable(item);
    } else {
      setUpgrades((u) => [...u, item.id]);
    }

    /** Legacy `legacy-game.html` ~10912 — højre skattekort-halvdel + evt. komplet-kort-modal. */
    if (item.id === 'map_right') {
      const hadMapLeft = questItems.includes('map_left');
      setQuestItems((prev) => (prev.includes('map_right') ? prev : [...prev, 'map_right']));
      play('unlock');
      setGameState('idle');
      setShopInitialTab('fishing_gear');
      window.setTimeout(() => {
        if (hadMapLeft) {
          useCollectionStore.getState().setShowMapReveal(true);
        } else {
          setToastMessage(
            '🗺 Du har højre halvdel af skattekortet! Find flaskeposten for at kompletere det.',
          );
        }
      }, 500);
      return;
    }

    if (item.id === 'cheese_bought') {
      setCheeseSources((prev) => (prev.includes('shop') ? prev : [...prev, 'shop']));
    }
    if (item.id === 'feather_bought') {
      setFeatherSources((prev) => (prev.includes('shop') ? prev : [...prev, 'shop']));
    }

    setToastMessage(`Købt: ${item.name}`);
  }

  function onBuyFurniture(item: FurnitureShopItem) {
    const status = getFurnitureBuyStatus(item, coins, unlockedFurniture);
    if (status !== 'available') {
      play('error');
      return;
    }
    play('purchase');
    setCoins((c) => c - item.price);
    unlockFurniture(item.id);
    setToastMessage(`${item.emoji} ${item.name} tilføjet til ${FURNITURE_ROOM_TOAST[item.room]}!`);
  }

  const furnitureForRoom = FURNITURE_SHOP_ITEMS.filter((i) => i.room === activeFurnitureRoom);

  return (
    <div
      className="panel-shop anim-zoom-in pointer-events-auto flex h-[82dvh] max-h-[82dvh] min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-700 p-8 shadow-2xl"
    >
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-4xl font-black" style={{ color: '#34d399' }}>
            🛒 Grejbutikken
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Du er level <span className="font-bold text-yellow-300">{level}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="panel-close-btn bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
        >
          ← Luk
        </button>
      </div>

      <div className="mb-5 flex shrink-0 flex-wrap gap-2">
        {shopTabs.map((tab) => {
          const furnitureLocked = tab.id === 'furniture' && !cabinUnlocked;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                play('ui');
                setActiveTab(tab.id);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : furnitureLocked
                    ? 'bg-slate-800/80 text-slate-500 hover:bg-slate-800'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {furnitureLocked && <span aria-hidden>🔒 </span>}
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'bait' && (
        <div className="mb-4 flex shrink-0 items-center gap-2 rounded-xl border border-amber-700/40 bg-amber-900/30 px-4 py-2 text-sm font-bold text-amber-300">
          🪱 Madding er engangsbrug — effekten aktiveres straks efter køb!
        </div>
      )}

      {activeTab === 'travel' && (
        <div className="mb-4 flex shrink-0 flex-col gap-2">
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
              hasDesertSet
                ? 'border border-orange-500/50 bg-orange-900/40 text-orange-300'
                : 'border border-slate-700 bg-slate-800/60 text-slate-400'
            }`}
          >
            <span className="text-lg">🏜️</span> Ørken-sæt:{' '}
            <span className={`font-black ${hasDesertSet ? 'text-green-400' : 'text-white'}`}>
              {desertOwned}/4
            </span>{' '}
            {hasDesertSet ? (
              <span className="ml-1 text-green-400">✓ Komplet!</span>
            ) : (
              <span className="ml-1 text-xs text-slate-500">— Køb alle 4 for Ørkensøen</span>
            )}
          </div>
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
              hasArcticSet
                ? 'border border-sky-500/50 bg-sky-900/40 text-sky-300'
                : 'border border-slate-700 bg-slate-800/60 text-slate-400'
            }`}
          >
            <span className="text-lg">🧊</span> Ishav-sæt:{' '}
            <span className={`font-black ${hasArcticSet ? 'text-green-400' : 'text-white'}`}>
              {arcticOwned}/4
            </span>{' '}
            {hasArcticSet ? (
              <span className="ml-1 text-green-400">✓ Komplet!</span>
            ) : (
              <span className="ml-1 text-xs text-slate-500">— Køb alle 4 for Ishavet</span>
            )}
          </div>
        </div>
      )}

      {activeTab === 'legendary' && (
        <div className="mb-4 flex shrink-0 items-center gap-2 rounded-xl border border-purple-700/40 bg-purple-900/30 px-4 py-2 text-sm font-bold text-purple-300">
          ✨ Sjældne og mægtige genstande til de mest erfarne fiskere!
        </div>
      )}

      {activeTab === 'furniture' && cabinUnlocked && (
        <div className="mb-3 flex shrink-0 flex-col gap-3">
          <p className="text-center text-sm leading-relaxed text-slate-300 md:text-left">
            Gør din fiskehytte hyggelig! Køb møbler og placer dem, som du vil.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-bold text-emerald-300/95 md:justify-start">
            <span aria-hidden>📦</span>
            <span>
              Samlet: {furniturePurchasedCount}/{FURNITURE_SHOP_COUNT} møbler købt
            </span>
            {furniturePurchasedCount === FURNITURE_SHOP_COUNT && (
              <span className="text-emerald-400">✓ Komplet!</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {furnitureRoomTabs.map((t) => {
              const complete = isFurnitureRoomComplete(t.id, unlockedFurniture);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    play('ui');
                    setActiveFurnitureRoom(t.id);
                  }}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase transition-all ${
                    activeFurnitureRoom === t.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {t.label}
                  {complete ? (
                    <span className="ml-1 text-emerald-300" title="Alle møbler i rummet købt">
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'furniture' && cabinUnlocked && (
        <div className="mb-4 flex shrink-0 items-center gap-2 rounded-xl border border-amber-700/30 bg-slate-800/80 px-4 py-2.5 text-sm font-bold text-slate-200">
          <CoinIcon size={20} />
          <span>
            Du har <span className="font-mono text-yellow-100">{coins}</span> coins
          </span>
        </div>
      )}

      <div
        className="scrollbar-hide grid min-h-0 flex-1 gap-4 overflow-y-auto p-1"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}
      >
        {activeTab === 'furniture' && !cabinUnlocked && (
          <div className="col-span-full flex min-h-[min(50dvh,320px)] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center">
            <span className="text-5xl" aria-hidden>
              🔒
            </span>
            <h3 className="text-xl font-bold text-slate-200">Kræver Fiskehytten</h3>
            <p className="max-w-sm text-base leading-relaxed text-slate-400">
              Køb Magnet-opgraderingen og find Fiskehyttens Nøgle for at låse møbler op!
            </p>
          </div>
        )}
        {activeTab === 'furniture' &&
          cabinUnlocked &&
          furnitureForRoom.map((item) => {
            const status = getFurnitureBuyStatus(item, coins, unlockedFurniture);
            const isOwned = status === 'owned';
            const isAvailable = status === 'available';
            const cardStyle = isOwned
              ? 'bg-slate-800/50 border-green-900/50'
              : 'border-slate-700 bg-slate-800 shadow-xl';

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-2xl border-2 p-5 transition-all ${cardStyle}`}
              >
                <div>
                  <div className="mb-3 flex items-start justify-between">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-3xl leading-none ${
                        isOwned ? 'bg-green-900' : 'bg-slate-700'
                      }`}
                    >
                      {item.emoji}
                    </div>
                    {isOwned && (
                      <span className="rounded-full bg-green-900/60 px-2.5 py-1 text-sm font-bold text-green-300">
                        ✓
                      </span>
                    )}
                  </div>
                  <h3 className="mb-1 text-xl font-bold text-white">
                    {item.emoji} {item.name}
                  </h3>
                  <p className="mb-2 text-base leading-relaxed text-slate-400">{item.description}</p>
                </div>
                {isOwned ? (
                  <div className="rounded-xl border border-green-900/50 bg-green-900/30 py-2.5 text-center text-base font-bold text-green-400">
                    ✅ Købt
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onBuyFurniture(item)}
                    disabled={!isAvailable}
                    className={`flex w-full min-h-[3rem] items-center justify-center gap-2 rounded-xl px-2 text-base font-bold transition-all ${
                      isAvailable
                        ? 'bg-amber-500 text-slate-900 hover:scale-105 hover:bg-amber-400 active:scale-95'
                        : 'cursor-not-allowed bg-slate-700 text-slate-500 opacity-60'
                    }`}
                  >
                    {isAvailable ? (
                      <span className="flex items-center gap-1.5">
                        <CoinIcon size={20} /> {item.price}
                      </span>
                    ) : (
                      'Ikke nok coins'
                    )}
                  </button>
                )}
              </div>
            );
          })}
        {activeTab !== 'furniture' &&
          currentItems.map((item) => {
          const status = getItemStatus(item, {
            coins,
            upgrades,
            level,
            questItems,
            cheeseSources,
            featherSources,
          });
          const areaUnlock = getAreaUnlock(item);
          const isOwned = status === 'owned';
          const isAvailable = status === 'available';
          const isAnyLocked =
            status === 'locked' || status === 'quest_locked' || status === 'upgrade_locked';
          const cardStyle = isOwned
            ? 'bg-slate-800/50 border-green-900/50'
            : isAnyLocked
              ? 'border-slate-800 bg-slate-900/80 opacity-70'
              : 'border-slate-700 bg-slate-800 shadow-xl';
          const isFree = item.cost === 0;

          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between rounded-2xl border-2 p-5 transition-all ${cardStyle}`}
            >
              <div>
                <div className="mb-3 flex items-start justify-between">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-3xl leading-none ${
                      isOwned ? 'bg-green-900' : isAnyLocked ? 'bg-slate-800' : 'bg-slate-700'
                    }`}
                  >
                    {isAnyLocked ? '🔒' : item.icon}
                  </div>
                  {!isOwned && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-sm font-bold tracking-wide ${
                        status === 'locked'
                          ? 'bg-red-900/60 text-red-400'
                          : isFree
                            ? 'bg-emerald-900/60 text-emerald-400'
                            : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {isFree ? 'GRATIS' : `LVL ${item.requiredLevel}+`}
                    </span>
                  )}
                </div>
                <h3 className="mb-1 text-xl font-bold text-white">{item.name}</h3>
                <p className="mb-2 text-base leading-relaxed text-slate-400">{item.description}</p>
                {areaUnlock && !isOwned && (
                  <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm font-bold text-emerald-400">
                    <span className="text-base">🗺</span>
                    <span>Låser op: {areaUnlock.name}</span>
                    {status === 'locked' && (
                      <span className="font-normal text-slate-500">
                        (kræver level {item.requiredLevel})
                      </span>
                    )}
                  </div>
                )}
              </div>
              {isOwned ? (
                <div className="rounded-xl border border-green-900/50 bg-green-900/30 py-2.5 text-center text-base font-bold text-green-400">
                  {item.permanent ? '⭐ Permanent aktiv' : '✅ Købt'}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onBuy(item.id)}
                  disabled={!isAvailable}
                  className={`flex w-full min-h-[3rem] items-center justify-center gap-2 rounded-xl px-2 text-base font-bold transition-all ${
                    isAvailable
                      ? 'bg-green-600 text-white hover:scale-105 hover:bg-green-500 active:scale-95'
                      : 'cursor-not-allowed bg-slate-700 text-slate-500 opacity-50'
                  }`}
                >
                  {isAvailable ? (
                    isFree ? (
                      `${item.icon} Hent`
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <CoinIcon size={20} /> {item.cost}
                      </span>
                    )
                  ) : status === 'locked' ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xl leading-none" aria-hidden>
                        🔒
                      </span>
                      <span>Kræver level {item.requiredLevel}</span>
                    </span>
                  ) : status === 'quest_locked' ? (
                    '🍾 Find venstre del'
                  ) : status === 'upgrade_locked' ? (
                    '🪣 Køb forrige'
                  ) : (
                    `💸 Mangler ${item.cost - coins} kr.`
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex shrink-0 items-center justify-between border-t border-slate-700/50 pt-4">
        <span className="text-sm text-slate-400">Din beholdning</span>
        <div className="flex items-center gap-2">
          <CoinIcon size={22} />
          <span className="font-mono text-xl font-bold text-yellow-100">{coins} kr.</span>
        </div>
      </div>
    </div>
  );
}
