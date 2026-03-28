import { LOCATIONS } from '../data/locations';
import { SHOP_ITEMS } from '../data/shop';
import type { GoalDef, GoalStats } from '../types/progression';

export function getGoalRowProgress(goal: GoalDef, s: GoalStats): { cur: number; max: number } | null {
  switch (goal.id) {
    case 'first_catch':
      return { cur: Math.min(s.totalCatches, 1), max: 1 };
    case 'catch_10':
      return { cur: Math.min(s.totalCatches, 10), max: 10 };
    case 'catch_50':
      return { cur: Math.min(s.totalCatches, 50), max: 50 };
    case 'earn_500':
      return { cur: Math.min(s.totalEarned, 500), max: 500 };
    case 'earn_5000':
      return { cur: Math.min(s.totalEarned, 5000), max: 5000 };
    case 'boss_slayer':
      return { cur: Math.min(s.bossWins, 5), max: 5 };
    case 'no_junk':
      return { cur: Math.min(s.bestJunkStreak, 10), max: 10 };
    case 'reach_5':
      return { cur: Math.min(s.maxLevel, 5), max: 5 };
    case 'reach_10':
      return { cur: Math.min(s.maxLevel, 10), max: 10 };
    case 'reach_20':
      return { cur: Math.min(s.maxLevel, 20), max: 20 };
    case 'fossil_1':
      return { cur: Math.min(s.fossilCount ?? 0, 1), max: 1 };
    case 'fossil_30':
      return { cur: Math.min(s.fossilCount ?? 0, 30), max: 30 };
    case 'globetrotter': {
      const locCount = Object.keys(LOCATIONS).length;
      return { cur: Math.min((s.areasVisited ?? []).length, locCount), max: locCount };
    }
    case 'scavenger':
      return { cur: Math.min(s.collectiblesFound ?? 0, 6), max: 6 };
    case 'conch_king':
      return { cur: Math.min(s.conchCount ?? 0, 10), max: 10 };
    case 'combo_master':
      return { cur: Math.min(s.maxCombo ?? 0, 5), max: 5 };
    case 'cave_axolotl':
      return { cur: s.axolotlCaught ? 1 : 0, max: 1 };
    case 'cave_crystal':
      return { cur: s.crystalFound ? 1 : 0, max: 1 };
    case 'cave_gorm':
      return { cur: s.gormDefeated ? 1 : 0, max: 1 };
    case 'cave_complete':
      return {
        cur:
          (s.axolotlCaught ? 1 : 0) + (s.crystalFound ? 1 : 0) + (s.gormDefeated ? 1 : 0),
        max: 3,
      };
    case 'companion_master':
      return { cur: Math.min(s.companionsUnlocked ?? 0, 5), max: 5 };
    case 'wish_master':
      return { cur: Math.min(s.wishesUsed ?? 0, 3), max: 3 };
    case 'full_upgrade':
      return { cur: Math.min(s.upgradesBought, SHOP_ITEMS.length), max: SHOP_ITEMS.length };
    case 'catch_rain':
      return { cur: Math.min(s.rainCatches, 1), max: 1 };
    case 'catch_storm':
      return { cur: Math.min(s.stormCatches, 1), max: 1 };
    case 'first_rare':
      return { cur: Math.min(s.rareCatches, 1), max: 1 };
    case 'first_legendary':
      return { cur: Math.min(s.legendaryCatches, 1), max: 1 };
    case 'first_treasure':
      return { cur: Math.min(s.treasureCatches, 1), max: 1 };
    case 'kraken':
      return { cur: s.krakenCaught ? 1 : 0, max: 1 };
    case 'explore_smaragd':
      return { cur: s.areasVisited.includes('smaragd') ? 1 : 0, max: 1 };
    case 'speed_catch':
      return { cur: Math.min(s.speedSolves, 1), max: 1 };
    case 'ouch_jellyfish':
      return { cur: Math.min(s.jellyfishCaught ?? 0, 1), max: 1 };
    case 'turtle_dad':
      return { cur: s.hasTurtleHatched ? 1 : 0, max: 1 };
    default:
      return null;
  }
}
