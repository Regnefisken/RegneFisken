import { create } from 'zustand';
import type { RollCatchResult } from '../types/fish.js';

interface FightStages {
  current: number;
  total: number;
}

interface FishingState {
  hookedFish: RollCatchResult | null;
  fightStages: FightStages;
  lastWasTrueBoss: boolean;
  lastCatch: RollCatchResult | null;
  currentStreak: number;
  streakMilestoneToast: string | null;
  monkeyHelpsThisRound: boolean;
  baitUsedToast: boolean;
  urgentPreloadId: string | null;
  setHookedFish: (v: RollCatchResult | null) => void;
  setFightStages: (v: FightStages | ((p: FightStages) => FightStages)) => void;
  setLastWasTrueBoss: (v: boolean) => void;
  setLastCatch: (v: RollCatchResult | null) => void;
  setCurrentStreak: (v: number | ((p: number) => number)) => void;
  setStreakMilestoneToast: (v: string | null) => void;
  setMonkeyHelpsThisRound: (v: boolean) => void;
  setBaitUsedToast: (v: boolean) => void;
  setUrgentPreload: (id: string | null) => void;
}

function resolve<T>(next: T | ((prev: T) => T), prev: T): T {
  return typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
}

export const useFishingStore = create<FishingState>((set) => ({
  hookedFish: null,
  fightStages: { current: 0, total: 1 },
  lastWasTrueBoss: false,
  lastCatch: null,
  currentStreak: 0,
  streakMilestoneToast: null,
  monkeyHelpsThisRound: false,
  baitUsedToast: false,
  urgentPreloadId: null,
  setHookedFish: (hookedFish) => set({ hookedFish }),
  setFightStages: (v) => set((s) => ({ fightStages: resolve(v, s.fightStages) })),
  setLastWasTrueBoss: (lastWasTrueBoss) => set({ lastWasTrueBoss }),
  setLastCatch: (lastCatch) => set({ lastCatch }),
  setCurrentStreak: (v) => set((s) => ({ currentStreak: resolve(v, s.currentStreak) })),
  setStreakMilestoneToast: (streakMilestoneToast) => set({ streakMilestoneToast }),
  setMonkeyHelpsThisRound: (monkeyHelpsThisRound) => set({ monkeyHelpsThisRound }),
  setBaitUsedToast: (baitUsedToast) => set({ baitUsedToast }),
  setUrgentPreload: (urgentPreloadId) => set({ urgentPreloadId }),
}));
