import { create } from 'zustand';
import type { RollCatchResult } from '../types/fish.js';
import type { GoalStats } from '../types/progression.js';
import { emptyStats } from '../logic/xp-engine.js';
import type { RoomId } from '../data/furnitureShopItems.js';
import { getDefaultRoomForType } from '../data/furnitureShopItems.js';

export interface ProgressionState {
  level: number;
  xp: number;
}

interface PlayerState {
  inventory: RollCatchResult[];
  coins: number;
  upgrades: string[];
  questItems: string[];
  activeBait: string | null;
  koedklumpActive: boolean;
  soeuhyreDefeated: boolean;
  hvalbofActive: boolean;
  krakenDefeated: boolean;
  /** Købte møbler (movableType); ét eksemplar per id. */
  unlockedFurniture: string[];
  /** Kun typer flyttet væk fra default-rum; manglede key = default-rum. */
  furnitureRoomAssignment: Record<string, RoomId>;
  hiddenFurniture: string[];
  furniturePositions: Record<string, { x: number; y: number; z: number; rot?: number }>;
  baitExpiry: number;
  progression: ProgressionState;
  stats: GoalStats;
  completedGoals: string[];
  cheeseSources: string[];
  featherSources: string[];
  conchBaitExpiry: number;
  fossilBaitExpiry: number;
  flyBaitExpiry: number;
  hajBloodExpiry: number;
  perleLimExpiry: number;
  eggHatchAt: number;
  eggCountdown: string;
  /** Sti B: æg efterladt i sandet — real-time klæk til vild skildpadde */
  eggLeftTimestamp: number | null;
  wildTurtleSpawned: boolean;
  krakenLoss: number;
  jungleDiscovered: boolean;
  setInventory: (v: RollCatchResult[] | ((p: RollCatchResult[]) => RollCatchResult[])) => void;
  setCoins: (v: number | ((p: number) => number)) => void;
  setUpgrades: (v: string[] | ((p: string[]) => string[])) => void;
  setQuestItems: (v: string[] | ((p: string[]) => string[])) => void;
  setActiveBait: (v: string | null) => void;
  setKoedklumpActive: (v: boolean) => void;
  setSoeuhyreDefeated: (v: boolean) => void;
  setHvalbofActive: (v: boolean) => void;
  setKrakenDefeated: (v: boolean) => void;
  unlockFurniture: (type: string) => void;
  moveFurnitureToRoom: (type: string, room: RoomId) => void;
  toggleHiddenFurniture: (type: string) => void;
  setFurniturePositions: (
    v:
      | Record<string, { x: number; y: number; z: number; rot?: number }>
      | ((
          p: Record<string, { x: number; y: number; z: number; rot?: number }>
        ) => Record<string, { x: number; y: number; z: number; rot?: number }>)
  ) => void;
  setBaitExpiry: (v: number) => void;
  setProgression: (v: ProgressionState | ((p: ProgressionState) => ProgressionState)) => void;
  setStats: (v: GoalStats | ((p: GoalStats) => GoalStats)) => void;
  setCompletedGoals: (v: string[] | ((p: string[]) => string[])) => void;
  setCheeseSources: (v: string[] | ((p: string[]) => string[])) => void;
  setFeatherSources: (v: string[] | ((p: string[]) => string[])) => void;
  setConchBaitExpiry: (v: number) => void;
  setFossilBaitExpiry: (v: number) => void;
  setFlyBaitExpiry: (v: number) => void;
  setHajBloodExpiry: (v: number) => void;
  setPerleLimExpiry: (v: number) => void;
  setEggHatchAt: (v: number) => void;
  setEggCountdown: (v: string) => void;
  setEggLeftTimestamp: (v: number | null) => void;
  setWildTurtleSpawned: (v: boolean) => void;
  setKrakenLoss: (v: number | ((p: number) => number)) => void;
  setJungleDiscovered: (v: boolean) => void;
}

function resolve<T>(next: T | ((prev: T) => T), prev: T): T {
  return typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  inventory: [],
  coins: 0,
  upgrades: [],
  questItems: [],
  activeBait: null,
  koedklumpActive: false,
  soeuhyreDefeated: false,
  hvalbofActive: false,
  krakenDefeated: false,
  unlockedFurniture: [],
  furnitureRoomAssignment: {},
  hiddenFurniture: [],
  furniturePositions: {},
  baitExpiry: 0,
  progression: { level: 1, xp: 0 },
  stats: emptyStats(),
  completedGoals: [],
  cheeseSources: [],
  featherSources: [],
  conchBaitExpiry: 0,
  fossilBaitExpiry: 0,
  flyBaitExpiry: 0,
  hajBloodExpiry: 0,
  perleLimExpiry: 0,
  eggHatchAt: 0,
  eggCountdown: '',
  eggLeftTimestamp: null,
  wildTurtleSpawned: false,
  krakenLoss: 0,
  jungleDiscovered: false,
  setInventory: (v) => set((s) => ({ inventory: resolve(v, s.inventory) })),
  setCoins: (v) => set((s) => ({ coins: resolve(v, s.coins) })),
  setUpgrades: (v) => set((s) => ({ upgrades: resolve(v, s.upgrades) })),
  setQuestItems: (v) => set((s) => ({ questItems: resolve(v, s.questItems) })),
  setActiveBait: (activeBait) => set({ activeBait }),
  setKoedklumpActive: (koedklumpActive) => set({ koedklumpActive }),
  setSoeuhyreDefeated: (soeuhyreDefeated) => set({ soeuhyreDefeated }),
  setHvalbofActive: (hvalbofActive) => set({ hvalbofActive }),
  setKrakenDefeated: (krakenDefeated) => set({ krakenDefeated }),
  unlockFurniture: (type) =>
    set((s) =>
      s.unlockedFurniture.includes(type)
        ? s
        : { unlockedFurniture: [...s.unlockedFurniture, type] },
    ),
  moveFurnitureToRoom: (type, room) =>
    set((s) => {
      const def = getDefaultRoomForType(type);
      const next = { ...s.furnitureRoomAssignment };
      if (room === def) {
        delete next[type];
      } else {
        next[type] = room;
      }
      return { furnitureRoomAssignment: next };
    }),
  toggleHiddenFurniture: (type) =>
    set((s) => {
      const has = s.hiddenFurniture.includes(type);
      return {
        hiddenFurniture: has
          ? s.hiddenFurniture.filter((t) => t !== type)
          : [...s.hiddenFurniture, type],
      };
    }),
  setFurniturePositions: (v) =>
    set((s) => ({ furniturePositions: resolve(v, s.furniturePositions) })),
  setBaitExpiry: (baitExpiry) => set({ baitExpiry }),
  setProgression: (v) => set((s) => ({ progression: resolve(v, s.progression) })),
  setStats: (v) => set((s) => ({ stats: resolve(v, s.stats) })),
  setCompletedGoals: (v) => set((s) => ({ completedGoals: resolve(v, s.completedGoals) })),
  setCheeseSources: (v) => set((s) => ({ cheeseSources: resolve(v, s.cheeseSources) })),
  setFeatherSources: (v) => set((s) => ({ featherSources: resolve(v, s.featherSources) })),
  setConchBaitExpiry: (conchBaitExpiry) => set({ conchBaitExpiry }),
  setFossilBaitExpiry: (fossilBaitExpiry) => set({ fossilBaitExpiry }),
  setFlyBaitExpiry: (flyBaitExpiry) => set({ flyBaitExpiry }),
  setHajBloodExpiry: (hajBloodExpiry) => set({ hajBloodExpiry }),
  setPerleLimExpiry: (perleLimExpiry) => set({ perleLimExpiry }),
  setEggHatchAt: (eggHatchAt) => set({ eggHatchAt }),
  setEggCountdown: (eggCountdown) => set({ eggCountdown }),
  setEggLeftTimestamp: (eggLeftTimestamp) => set({ eggLeftTimestamp }),
  setWildTurtleSpawned: (wildTurtleSpawned) => set({ wildTurtleSpawned }),
  setKrakenLoss: (v) => set((s) => ({ krakenLoss: resolve(v, s.krakenLoss) })),
  setJungleDiscovered: (jungleDiscovered) => set({ jungleDiscovered }),
}));
