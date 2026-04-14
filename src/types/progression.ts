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
  junkCatches: number;
  frogCatches: number;
  sharkCaught: boolean;
  narwhalCaught: boolean;
  plesiosaurCaught: boolean;
  goldenCarpCaught: boolean;
  /** Afledt i buildGoalStatsSnapshot som tropicalFishCaughtIds.length */
  tropicalSpeciesCaught: number;
  tropicalFishCaughtIds: string[];
  bottleCatches: number;
  tireCaught: number;
  teddyCaught: number;
  perfectBossWins: number;
  hasLuxuryBoat: boolean;
  legendarySold: number;
  ratUnlocked: boolean;
  parrotUnlocked: boolean;
  pearlCount: number;
  nightCatches: number;
  snowCatches: number;
  hasTurtleHatched: boolean;
  collectiblesFound: number;
  conchCount: number;
  companionsUnlocked: number;
  wishesUsed: number;
  /** Set af opgave-categories spilleren har klaret mindst én af korrekt */
  solvedCategories: string[];
  /** Antal korrekt løste brøk-opgaver */
  fractionSolves: number;
  /** Antal korrekt løste procent-opgaver */
  percentSolves: number;
  /** Antal korrekt løste mønster-opgaver */
  patternSolves: number;
  /** Antal korrekt løste halvdel/dobbelt-opgaver */
  halvdelDobbeltSolves: number;
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
