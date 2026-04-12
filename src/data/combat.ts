import type { PoolRarityWeights, FightParamsMap, SpecialOnCatchMap } from '../types/game.js';

export const POOL_WEIGHTS = { 'Almindelig': 65, 'Sjælden': 25, 'Legendarisk': 8, 'Mystisk': 1 } as const satisfies PoolRarityWeights;

export const FIGHT_PARAMS = {
  'fish': { requiredAnswers: 1, baseTimeLimit: 0 },
  'piranha': { requiredAnswers: 3, baseTimeLimit: 25 },
  'kraken': { requiredAnswers: 3, baseTimeLimit: 30 },
  'oyster': { requiredAnswers: 3, baseTimeLimit: 30 },
  'gnavne_gorm': { requiredAnswers: 6, baseTimeLimit: 30 },
  'boss_hvidhaj': { requiredAnswers: 6, baseTimeLimit: 30 },
  'soeuhyre': { requiredAnswers: 6, baseTimeLimit: 32 }, // === NY SØUHYRE ===
  'plesiosaur': { requiredAnswers: 3, baseTimeLimit: 30 },
  'halibut': { requiredAnswers: 1, baseTimeLimit: 0 },
  'axolotl': { requiredAnswers: 1, baseTimeLimit: 0 },
  'crystal_junk': { requiredAnswers: 1, baseTimeLimit: 0 },
  'jellyfish': { requiredAnswers: 1, baseTimeLimit: 0 },
  'treasure': { requiredAnswers: 1, baseTimeLimit: 0 },
  'conch': { requiredAnswers: 1, baseTimeLimit: 0 },
  'bottle': { requiredAnswers: 1, baseTimeLimit: 0 },
  'fossil': { requiredAnswers: 1, baseTimeLimit: 0 },
  'nothing': { requiredAnswers: 0, baseTimeLimit: 0 },
  'junk': { requiredAnswers: 1, baseTimeLimit: 0 }
} as const satisfies FightParamsMap;

export const SPECIAL_ON_CATCH = {
  'kraken': 'krakenPenalty', 'halibut': 'wishMenu',
  'jellyfish': 'bucketWipe', 'axolotl': 'companionUnlock', 'gnavne_gorm': 'bossReward',
  'crystal_junk': 'crystalReward', 'plesiosaur': 'consumeBait', 'oyster': 'pearlDrop', 'boss_hvidhaj': 'bossReward',
  'golden_frog': 'unlockGoldenFrogFurniture', 'soeuhyre': 'soeuhyre_boss' // === NY SØUHYRE ===
} as const satisfies SpecialOnCatchMap;

/** Forkert svar nulstiller ikke streak for disse typer (legacy STREAK_EXCEPTION_TYPES). */
export const STREAK_EXCEPTION_TYPES = new Set<string>(['jellyfish', 'piranha', 'kraken']);

export const TRUE_BOSS_IDS = new Set<string>([
  'kraken',
  'oyster',
  'fisk_gnavne_gorm',
  'fisk_plesiosaurus',
  'fisk_hvidhaj',
  'fisk_soeuhyre',
]);

export const TRUE_BOSS_ITEM_TYPES = new Set<string>([
  'kraken',
  'oyster',
  'gnavne_gorm',
  'plesiosaur',
  'boss_hvidhaj',
  'soeuhyre',
]);
