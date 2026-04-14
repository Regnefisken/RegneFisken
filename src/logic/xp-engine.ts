import { ENRICHED_CATCH_DATA } from '../data/enrichment.js';
import { XP_REWARDS } from '../data/xp.js';
import { xpNeededForLevel } from '../data/xp.js';
import type { RollCatchResult } from '../types/fish.js';
import type { GoalStats } from '../types/progression.js';

/** Basis-XP for en fangst (som `calcXpForCatch` / MathChallenge). */
export function xpForCatch(fish: RollCatchResult): number {
  if (fish.xpReward != null) return fish.xpReward;
  if (fish.itemType === 'junk') return XP_REWARDS.item.junk;
  if (fish.itemType === 'treasure') return XP_REWARDS.item.treasure;
  const e = fish.fishModelId
    ? ENRICHED_CATCH_DATA.find((x) => x.id === fish.fishModelId)
    : undefined;
  if (e?.baseXP != null) return e.baseXP;
  const key = fish.rarity as keyof typeof XP_REWARDS.fish;
  return XP_REWARDS.fish[key] ?? XP_REWARDS.fish.Almindelig;
}

export function calculateStreakBonus(
  currentStreak: number,
  isZenMode: boolean,
  baseTotalValue = 0
): number {
  if (currentStreak < 5) return 0;
  if (baseTotalValue <= 0) return 0;
  if (isZenMode) return currentStreak;
  const tiers = Math.floor(currentStreak / 5);
  return tiers * 3;
}

export function getFinalStreakBonus(
  currentStreak: number,
  isZenMode: boolean,
  baseTotalValue = 1
): number {
  return calculateStreakBonus(currentStreak, isZenMode, baseTotalValue);
}

export function emptyStats(): GoalStats {
  return {
    totalCatches: 0,
    rareCatches: 0,
    legendaryCatches: 0,
    treasureCatches: 0,
    krakenCaught: false,
    bestJunkStreak: 0,
    currentJunkStreak: 0,
    totalEarned: 0,
    totalSold: 0,
    upgradesBought: 0,
    maxLevel: 1,
    areasVisited: ['pier'],
    speedSolves: 0,
    bossWins: 0,
    fossilCount: 0,
    rainCatches: 0,
    stormCatches: 0,
    maxCombo: 0,
    jellyfishCaught: 0,
    axolotlCaught: false,
    crystalFound: false,
    gormDefeated: false,
    junkCatches: 0,
    frogCatches: 0,
    sharkCaught: false,
    narwhalCaught: false,
    plesiosaurCaught: false,
    goldenCarpCaught: false,
    tropicalSpeciesCaught: 0,
    tropicalFishCaughtIds: [],
    bottleCatches: 0,
    tireCaught: 0,
    teddyCaught: 0,
    perfectBossWins: 0,
    hasLuxuryBoat: false,
    legendarySold: 0,
    ratUnlocked: false,
    parrotUnlocked: false,
    pearlCount: 0,
    nightCatches: 0,
    snowCatches: 0,
    hasTurtleHatched: false,
    collectiblesFound: 0,
    conchCount: 0,
    companionsUnlocked: 0,
    wishesUsed: 0,
    solvedCategories: [],
    fractionSolves: 0,
    percentSolves: 0,
    patternSolves: 0,
    halvdelDobbeltSolves: 0,
  };
}

export function applyXP(
  currentLevel: number,
  currentXp: number,
  amount: number
): { level: number; xp: number; levelUps: number[] } {
  let level = currentLevel;
  let xp = currentXp + amount;
  const levelUps: number[] = [];
  while (xp >= xpNeededForLevel(level)) {
    xp -= xpNeededForLevel(level);
    level += 1;
    levelUps.push(level);
  }
  return { level, xp, levelUps };
}
