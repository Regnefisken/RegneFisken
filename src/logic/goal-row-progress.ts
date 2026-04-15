import { COMPANIONS_DATABASE } from '../data/collectibles.js';
import { GLOBETROTTER_TARGET_COUNT } from '../data/locations.js';
import { TROPICAL_SPECIES_COUNT } from '../data/progression.js';
import { SHOP_ITEMS } from '../data/shop.js';
import type { GoalDef, GoalStats } from '../types/progression.js';

export function getGoalRowProgress(goal: GoalDef, s: GoalStats): { cur: number; max: number } | null {
  switch (goal.id) {
    case 'first_catch':
      return { cur: Math.min(s.totalCatches, 1), max: 1 };
    case 'catch_10':
      return { cur: Math.min(s.totalCatches, 10), max: 10 };
    case 'catch_50':
      return { cur: Math.min(s.totalCatches, 50), max: 50 };
    case 'catch_25':
      return { cur: Math.min(s.totalCatches, 25), max: 25 };
    case 'catch_100':
      return { cur: Math.min(s.totalCatches, 100), max: 100 };
    case 'catch_250':
      return { cur: Math.min(s.totalCatches, 250), max: 250 };
    case 'first_junk':
      return { cur: Math.min(s.junkCatches, 1), max: 1 };
    case 'catch_frog':
      return { cur: Math.min(s.frogCatches, 1), max: 1 };
    case 'catch_shark':
      return { cur: s.sharkCaught ? 1 : 0, max: 1 };
    case 'catch_narwhale':
      return { cur: s.narwhalCaught ? 1 : 0, max: 1 };
    case 'catch_plesiosaur':
      return { cur: s.plesiosaurCaught ? 1 : 0, max: 1 };
    case 'catch_golden_carp':
      return { cur: s.goldenCarpCaught ? 1 : 0, max: 1 };
    case 'catch_all_tropisk':
      return { cur: Math.min(s.tropicalSpeciesCaught, TROPICAL_SPECIES_COUNT), max: TROPICAL_SPECIES_COUNT };
    case 'catch_5_junk':
      return { cur: Math.min(s.junkCatches, 5), max: 5 };
    case 'junk_tire':
      return { cur: Math.min(s.tireCaught, 1), max: 1 };
    case 'junk_teddy':
      return { cur: Math.min(s.teddyCaught, 1), max: 1 };
    case 'catch_bottle':
      return { cur: Math.min(s.bottleCatches, 1), max: 1 };
    case 'math_streak_3':
      return { cur: Math.min(s.maxCombo ?? 0, 3), max: 3 };
    case 'math_streak_10':
      return { cur: Math.min(s.maxCombo ?? 0, 10), max: 10 };
    case 'math_speed_5':
      return { cur: Math.min(s.speedSolves, 5), max: 5 };
    case 'math_perfect_boss':
      return { cur: Math.min(s.perfectBossWins, 1), max: 1 };
    case 'math_boss_10':
      return { cur: Math.min(s.bossWins, 10), max: 10 };
    case 'jellyfish_10':
      return { cur: Math.min(s.jellyfishCaught ?? 0, 10), max: 10 };
    case 'first_halvdel':
      return { cur: (s.solvedCategories ?? []).includes('emoji-half') ? 1 : 0, max: 1 };
    case 'first_dobbelt':
      return { cur: (s.solvedCategories ?? []).includes('emoji-double') ? 1 : 0, max: 1 };
    case 'first_pattern':
      return { cur: (s.solvedCategories ?? []).includes('emoji-pattern') ? 1 : 0, max: 1 };
    case 'first_fraction':
      return { cur: (s.solvedCategories ?? []).includes('emoji-fraction') ? 1 : 0, max: 1 };
    case 'first_percent':
      return { cur: (s.solvedCategories ?? []).includes('emoji-percent') ? 1 : 0, max: 1 };
    case 'halvdel_dobbelt_10':
      return { cur: Math.min(s.halvdelDobbeltSolves ?? 0, 10), max: 10 };
    case 'pattern_10':
      return { cur: Math.min(s.patternSolves ?? 0, 10), max: 10 };
    case 'fraction_master':
      return { cur: Math.min(s.fractionSolves ?? 0, 15), max: 15 };
    case 'percent_master':
      return { cur: Math.min(s.percentSolves ?? 0, 15), max: 15 };
    case 'emoji_master': {
      const allEmojiCats = [
        'emoji-antal',
        'emoji-counting',
        'emoji-most-least',
        'emoji-size-compare',
        'emoji-half',
        'emoji-double',
        'emoji-even-odd',
        'emoji-pattern',
        'emoji-sort',
        'emoji-equalize',
        'emoji-fraction',
        'emoji-percent',
      ];
      const solved = allEmojiCats.filter((c) => (s.solvedCategories ?? []).includes(c)).length;
      return { cur: solved, max: 12 };
    }
    case 'earn_500':
      return { cur: Math.min(s.totalEarned, 500), max: 500 };
    case 'earn_1000':
      return { cur: Math.min(s.totalEarned, 1000), max: 1000 };
    case 'earn_25000':
      return { cur: Math.min(s.totalEarned, 25000), max: 25000 };
    case 'earn_5000':
      return { cur: Math.min(s.totalEarned, 5000), max: 5000 };
    case 'first_upgrade':
      return { cur: Math.min(s.upgradesBought, 1), max: 1 };
    case 'buy_luxury_boat':
      return { cur: s.hasLuxuryBoat ? 1 : 0, max: 1 };
    case 'sell_legendary':
      return { cur: Math.min(s.legendarySold, 1), max: 1 };
    case 'boss_slayer':
      return { cur: Math.min(s.bossWins, 5), max: 5 };
    case 'no_junk':
      return { cur: Math.min(s.bestJunkStreak, 10), max: 10 };
    case 'reach_3':
      return { cur: Math.min(s.maxLevel, 3), max: 3 };
    case 'reach_5':
      return { cur: Math.min(s.maxLevel, 5), max: 5 };
    case 'reach_10':
      return { cur: Math.min(s.maxLevel, 10), max: 10 };
    case 'reach_15':
      return { cur: Math.min(s.maxLevel, 15), max: 15 };
    case 'reach_20':
      return { cur: Math.min(s.maxLevel, 20), max: 20 };
    case 'reach_25':
      return { cur: Math.min(s.maxLevel, 25), max: 25 };
    case 'reach_30':
      return { cur: Math.min(s.maxLevel, 30), max: 30 };
    case 'reach_35':
      return { cur: Math.min(s.maxLevel, 35), max: 35 };
    case 'reach_40':
      return { cur: Math.min(s.maxLevel, 40), max: 40 };
    case 'reach_45':
      return { cur: Math.min(s.maxLevel, 45), max: 45 };
    case 'reach_50':
      return { cur: Math.min(s.maxLevel, 50), max: 50 };
    case 'fossil_1':
      return { cur: Math.min(s.fossilCount ?? 0, 1), max: 1 };
    case 'fossil_10':
      return { cur: Math.min(s.fossilCount ?? 0, 10), max: 10 };
    case 'fossil_30':
      return { cur: Math.min(s.fossilCount ?? 0, 30), max: 30 };
    case 'globetrotter': {
      const locCount = GLOBETROTTER_TARGET_COUNT;
      return { cur: Math.min((s.areasVisited ?? []).length, locCount), max: locCount };
    }
    case 'visit_cave':
      return { cur: s.areasVisited.includes('cave') ? 1 : 0, max: 1 };
    case 'visit_arctic':
      return { cur: s.areasVisited.includes('arctic_sea') ? 1 : 0, max: 1 };
    case 'visit_desert':
      return { cur: s.areasVisited.includes('desert_lake') ? 1 : 0, max: 1 };
    case 'visit_forbidden':
      return { cur: s.areasVisited.includes('forbidden') ? 1 : 0, max: 1 };
    case 'visit_jungle':
      return { cur: s.areasVisited.includes('jungle_island') ? 1 : 0, max: 1 };
    case 'visit_cabin':
      return { cur: s.areasVisited.includes('cabin_living') ? 1 : 0, max: 1 };
    case 'wish_first':
      return { cur: Math.min(s.wishesUsed ?? 0, 1), max: 1 };
    case 'scavenger':
      return { cur: Math.min(s.collectiblesFound ?? 0, 6), max: 6 };
    case 'conch_king':
      return { cur: Math.min(s.conchCount ?? 0, 10), max: 10 };
    case 'conch_5':
      return { cur: Math.min(s.conchCount ?? 0, 5), max: 5 };
    case 'conch_first':
      return { cur: Math.min(s.conchCount ?? 0, 1), max: 1 };
    case 'pearl_5':
      return { cur: Math.min(s.pearlCount ?? 0, 5), max: 5 };
    case 'pearl_10':
      return { cur: Math.min(s.pearlCount ?? 0, 10), max: 10 };
    case 'conch_20':
      return { cur: Math.min(s.conchDelivered ?? 0, 20), max: 20 };
    case 'npc_master':
      return {
        cur: Math.min(s.fossilCount ?? 0, s.conchDelivered ?? 0, s.pearlCount ?? 0),
        max: 10,
      };
    case 'pirate_cat_unlocked':
      return { cur: s.pirateCatUnlocked ? 1 : 0, max: 1 };
    case 'pirate_chest_obtained':
      return { cur: s.pirateChestUnlocked ? 1 : 0, max: 1 };
    case 'jungle_key_obtained':
      return { cur: s.jungleKeyObtained ? 1 : 0, max: 1 };
    case 'first_companion':
      return { cur: Math.min(s.companionsUnlocked ?? 0, 1), max: 1 };
    case 'rat_friend':
      return { cur: s.ratUnlocked ? 1 : 0, max: 1 };
    case 'parrot_friend':
      return { cur: s.parrotUnlocked ? 1 : 0, max: 1 };
    case 'all_companions':
      return {
        cur: Math.min(s.companionsUnlocked ?? 0, COMPANIONS_DATABASE.length),
        max: COMPANIONS_DATABASE.length,
      };
    case 'haps_friend':
      return {
        cur: Math.min(s.sardineDelivered ?? 0, 10),
        max: 10,
      };
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
    case 'wish_master':
      return { cur: Math.min(s.wishesUsed ?? 0, 3), max: 3 };
    case 'full_upgrade':
      return { cur: Math.min(s.upgradesBought, SHOP_ITEMS.length), max: SHOP_ITEMS.length };
    case 'catch_rain':
      return { cur: Math.min(s.rainCatches, 1), max: 1 };
    case 'catch_10_rain':
      return { cur: Math.min(s.rainCatches, 10), max: 10 };
    case 'catch_storm':
      return { cur: Math.min(s.stormCatches, 1), max: 1 };
    case 'catch_night':
      return { cur: Math.min(s.nightCatches, 1), max: 1 };
    case 'catch_snow':
      return { cur: Math.min(s.snowCatches, 1), max: 1 };
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
