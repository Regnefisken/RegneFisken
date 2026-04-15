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
  /** Afleverede konkylier til Pingvin-NPC (ikke taske-lager) */
  conchDelivered: number;
  /** Skibskatten Kradse låst op via pirat-fossil milestone 5 */
  pirateCatUnlocked: boolean;
  /** Havfruens jungle-nøgle modtaget via pearl milestone 10 */
  jungleKeyObtained: boolean;
  /** Piratens skattekiste låst op via fossil milestone 10 */
  pirateChestUnlocked: boolean;
  /** Afleverede sardiner til Havnemågen Haps */
  sardineDelivered: number;
  /** Havnemågen Haps låst op via sardine-milepæl 10 */
  hapsUnlocked: boolean;
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
