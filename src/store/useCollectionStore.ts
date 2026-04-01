import { create } from 'zustand';

export interface AchievementRow {
  id: string;
  name: string;
  desc: string;
  unlocked: boolean;
}

export interface CollectibleCounts {
  fossilCount: number;
  conchCount: number;
  pearlCount: number;
}

export interface CollectibleDelivered {
  fossil: number;
  conch: number;
  pearl: number;
}

export type WishId = 'friend' | 'love' | 'wealth';

export interface WishOptionRow {
  id: WishId;
  label: string;
  description: string;
}

interface CollectionState {
  achievements: AchievementRow[];
  helleflynderCaught: number;
  collectibleInventory: CollectibleCounts;
  collectibleDelivered: CollectibleDelivered;
  showWishModal: boolean;
  wishOptions: WishOptionRow[];
  usedWishes: WishId[];
  hasMonkeyOnPier: boolean;
  showMonkeyBubble: boolean;
  hasHeartBalloon: boolean;
  hasVisitedCabin: boolean;
  showCabinInfo: boolean;
  balloonPopped: boolean;
  balloonCurrentHideout: string | null;
  showPlesioNPC: boolean;
  /** Jungleø: dialog for transport tilbage til molen. */
  showJunglePlesioNPC: boolean;
  showMapReveal: boolean;
  unlockedCompanions: string[];
  hasGoldenFrog: boolean;
  goldenFrogCount: number;
  showRat: boolean;
  ratFactIndex: number;
  showParrot: boolean;
  parrotTypedText: string;
  parrotFullText: string;
  parrotJokePhase: 'question' | 'answer';
  wildTurtleSpawned: boolean;
  showWildTurtleModal: boolean;
  setAchievements: (v: AchievementRow[] | ((p: AchievementRow[]) => AchievementRow[])) => void;
  setHelleflynderCaught: (v: number | ((p: number) => number)) => void;
  setCollectibleInventory: (
    v: CollectibleCounts | ((p: CollectibleCounts) => CollectibleCounts)
  ) => void;
  setCollectibleDelivered: (
    v: CollectibleDelivered | ((p: CollectibleDelivered) => CollectibleDelivered)
  ) => void;
  setShowWishModal: (v: boolean) => void;
  setWishOptions: (v: WishOptionRow[] | ((p: WishOptionRow[]) => WishOptionRow[])) => void;
  setUsedWishes: (v: WishId[] | ((p: WishId[]) => WishId[])) => void;
  setHasMonkeyOnPier: (v: boolean) => void;
  setShowMonkeyBubble: (v: boolean) => void;
  setHasHeartBalloon: (v: boolean) => void;
  setHasVisitedCabin: (v: boolean) => void;
  setShowCabinInfo: (v: boolean) => void;
  setBalloonPopped: (v: boolean) => void;
  setBalloonCurrentHideout: (v: string | null) => void;
  setShowPlesioNPC: (v: boolean) => void;
  setShowJunglePlesioNPC: (v: boolean) => void;
  setShowMapReveal: (v: boolean) => void;
  setUnlockedCompanions: (v: string[] | ((p: string[]) => string[])) => void;
  setHasGoldenFrog: (v: boolean) => void;
  setGoldenFrogCount: (v: number | ((p: number) => number)) => void;
  setShowRat: (v: boolean) => void;
  setRatFactIndex: (v: number | ((p: number) => number)) => void;
  setShowParrot: (v: boolean) => void;
  setParrotTypedText: (v: string) => void;
  setParrotFullText: (v: string) => void;
  setParrotJokePhase: (v: 'question' | 'answer') => void;
  setWildTurtleSpawned: (v: boolean) => void;
  setShowWildTurtleModal: (v: boolean) => void;
}

function resolve<T>(next: T | ((prev: T) => T), prev: T): T {
  return typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
}

const defaultAchievements: AchievementRow[] = [
  {
    id: 'first_plesio',
    name: 'Forhistorisk Jæger',
    desc: 'Fang din første Plesiosaurus',
    unlocked: false,
  },
  { id: 'level_20', name: 'Mesterfisker', desc: 'Nå level 20', unlocked: false },
  { id: 'full_bucket', name: 'Spand af Guld', desc: 'Sælg 1000 fisk', unlocked: false },
];

export const useCollectionStore = create<CollectionState>((set) => ({
  achievements: defaultAchievements,
  helleflynderCaught: 0,
  collectibleInventory: { fossilCount: 0, conchCount: 0, pearlCount: 0 },
  collectibleDelivered: { fossil: 0, conch: 0, pearl: 0 },
  showWishModal: false,
  wishOptions: [],
  usedWishes: [],
  hasMonkeyOnPier: false,
  showMonkeyBubble: false,
  hasHeartBalloon: false,
  hasVisitedCabin: false,
  showCabinInfo: false,
  balloonPopped: false,
  balloonCurrentHideout: null,
  showPlesioNPC: false,
  showJunglePlesioNPC: false,
  showMapReveal: false,
  unlockedCompanions: [],
  hasGoldenFrog: false,
  goldenFrogCount: 0,
  showRat: false,
  ratFactIndex: 0,
  showParrot: false,
  parrotTypedText: '',
  parrotFullText: '',
  parrotJokePhase: 'question',
  wildTurtleSpawned: false,
  showWildTurtleModal: false,
  setAchievements: (v) => set((s) => ({ achievements: resolve(v, s.achievements) })),
  setHelleflynderCaught: (v) => set((s) => ({ helleflynderCaught: resolve(v, s.helleflynderCaught) })),
  setCollectibleInventory: (v) =>
    set((s) => ({ collectibleInventory: resolve(v, s.collectibleInventory) })),
  setCollectibleDelivered: (v) =>
    set((s) => ({ collectibleDelivered: resolve(v, s.collectibleDelivered) })),
  setShowWishModal: (showWishModal) => set({ showWishModal }),
  setWishOptions: (v) => set((s) => ({ wishOptions: resolve(v, s.wishOptions) })),
  setUsedWishes: (v) => set((s) => ({ usedWishes: resolve(v, s.usedWishes) })),
  setHasMonkeyOnPier: (hasMonkeyOnPier) => set({ hasMonkeyOnPier }),
  setShowMonkeyBubble: (showMonkeyBubble) => set({ showMonkeyBubble }),
  setHasHeartBalloon: (hasHeartBalloon) => set({ hasHeartBalloon }),
  setHasVisitedCabin: (hasVisitedCabin) => set({ hasVisitedCabin }),
  setShowCabinInfo: (showCabinInfo) => set({ showCabinInfo }),
  setBalloonPopped: (balloonPopped) => set({ balloonPopped }),
  setBalloonCurrentHideout: (balloonCurrentHideout) => set({ balloonCurrentHideout }),
  setShowPlesioNPC: (showPlesioNPC) => set({ showPlesioNPC }),
  setShowJunglePlesioNPC: (showJunglePlesioNPC) => set({ showJunglePlesioNPC }),
  setShowMapReveal: (showMapReveal) => set({ showMapReveal }),
  setUnlockedCompanions: (v) =>
    set((s) => ({ unlockedCompanions: resolve(v, s.unlockedCompanions) })),
  setHasGoldenFrog: (hasGoldenFrog) => set({ hasGoldenFrog }),
  setGoldenFrogCount: (v) => set((s) => ({ goldenFrogCount: resolve(v, s.goldenFrogCount) })),
  setShowRat: (showRat) => set({ showRat }),
  setRatFactIndex: (v) => set((s) => ({ ratFactIndex: resolve(v, s.ratFactIndex) })),
  setShowParrot: (showParrot) => set({ showParrot }),
  setParrotTypedText: (parrotTypedText) => set({ parrotTypedText }),
  setParrotFullText: (parrotFullText) => set({ parrotFullText }),
  setParrotJokePhase: (parrotJokePhase) => set({ parrotJokePhase }),
  setWildTurtleSpawned: (wildTurtleSpawned) => set({ wildTurtleSpawned }),
  setShowWildTurtleModal: (showWildTurtleModal) => set({ showWildTurtleModal }),
}));
