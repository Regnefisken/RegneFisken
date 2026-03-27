import type { GoalReward } from './save.js';

/** Stats brugt til goal-conditions (spejler legacy emptyStats + udvidelser). */
export interface GoalStats {
  totalCatches: number;
  rareCatches: number;
  legendaryCatches: number;
  treasureCatches: number;
  krakenCaught: boolean;
  bestJunkStreak: number;
  currentJunkStreak: number;
  totalEarned: number;
  totalSold: number;
  upgradesBought: number;
  maxLevel: number;
  areasVisited: string[];
  speedSolves: number;
  bossWins: number;
  fossilCount: number;
  rainCatches: number;
  stormCatches: number;
  maxCombo: number;
  jellyfishCaught: number;
  axolotlCaught: boolean;
  crystalFound: boolean;
  gormDefeated: boolean;
  hasTurtleHatched?: boolean;
  collectiblesFound?: number;
  conchCount?: number;
  companionsUnlocked?: number;
  wishesUsed?: number;
}

export interface GoalDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  condition: (s: GoalStats) => boolean;
  reward: GoalReward;
  secret: boolean;
}
