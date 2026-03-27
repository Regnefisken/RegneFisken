import { CATCH_MASTER_DATA } from './fish.js';
import {
  POOL_WEIGHTS,
  FIGHT_PARAMS,
  SPECIAL_ON_CATCH,
  TRUE_BOSS_IDS,
} from './combat.js';
import type { EnrichedCatchEntry } from '../types/fish.js';

export const BASE_DEFAULTS = {
  'Almindelig':   { baseWeightMin: 1, baseWeightMax: 5,  baseValue: 25,  baseXP: 8,   baseDR: 100 },
  'Sjælden':      { baseWeightMin: 2, baseWeightMax: 12, baseValue: 40,  baseXP: 15,  baseDR: 100 },
  'Legendarisk':  { baseWeightMin: 5, baseWeightMax: 30, baseValue: 80,  baseXP: 35,  baseDR: 100 },
  'Mystisk':      { baseWeightMin: 5, baseWeightMax: 25, baseValue: 100, baseXP: 50,  baseDR: 100 },
  'Forhistorisk': { baseWeightMin: 200, baseWeightMax: 600, baseValue: 200, baseXP: 100, baseDR: 100 },
  'Boss':         { baseWeightMin: 50, baseWeightMax: 200, baseValue: 150, baseXP: 75,  baseDR: 100 },
  'Quest':        { baseWeightMin: 0.1, baseWeightMax: 3, baseValue: 0,   baseXP: 25,  baseDR: 100 },
  'Fare':         { baseWeightMin: 0.05, baseWeightMax: 0.3, baseValue: 0, baseXP: 0,  baseDR: 100 }
} as const;

export const ENRICHED_CATCH_DATA: EnrichedCatchEntry[] = CATCH_MASTER_DATA.map((c) => {
  const rarityKey = c.rarity as keyof typeof BASE_DEFAULTS;
  const defaults = BASE_DEFAULTS[rarityKey] ?? BASE_DEFAULTS['Almindelig'];
  const bwMin = c.weightRange ? c.weightRange[0] : defaults.baseWeightMin;
  const bwMax = c.weightRange ? c.weightRange[1] : defaults.baseWeightMax;
  const itemType = c.itemType as keyof typeof FIGHT_PARAMS;
  const fightParams =
    FIGHT_PARAMS[itemType] ?? { requiredAnswers: 1, baseTimeLimit: 0 };
  const special =
    SPECIAL_ON_CATCH[c.itemType as keyof typeof SPECIAL_ON_CATCH] ?? null;
  return {
    ...c,
    isTrueBoss: TRUE_BOSS_IDS.has(c.id),
    locations: [...c.primaryAreas],
    baseWeightMin: bwMin,
    baseWeightMax: bwMax,
    baseValue: c.value != null ? c.value : defaults.baseValue,
    baseXP: c.xpReward != null ? c.xpReward : defaults.baseXP,
    baseDR: defaults.baseDR,
    weightRange: [bwMin, bwMax] as [number, number],
    fightParams,
    specialOnCatch: special,
    lootWeight:
      c.lootWeight != null
        ? c.lootWeight
        : c.type === 'fish' || c.type === 'treasure'
          ? POOL_WEIGHTS[c.rarity as keyof typeof POOL_WEIGHTS] ?? 10
          : 0,
  };
});

export function matchesLocation(entry: { locations: string[] }, location: string): boolean {
  return entry.locations.includes(location) || entry.locations.includes('all');
}

export type ModifierCtx = {
  difficulty?: number;
  isBoss?: boolean;
  isPlesiosaur?: boolean;
  rodTimeBonus?: number;
  zenMode?: boolean;
  specialOnCatch?: string | null;
};

export const MODIFIER_PIPELINE = {
  applyLootModifiers<T extends Record<string, number>>(baseWeights: T, _ctx?: unknown): T {
    void _ctx;
    return { ...baseWeights };
  },
  applyCombatModifiers(
    baseFP: { requiredAnswers: number; baseTimeLimit: number },
    ctx: ModifierCtx
  ) {
    const { requiredAnswers, baseTimeLimit } = baseFP;
    let timeLimit =
      baseTimeLimit > 0
        ? baseTimeLimit
        : ctx.difficulty === 3
          ? 12
          : ctx.difficulty === 2
            ? 10
            : 8;
    if (ctx.isBoss || ctx.isPlesiosaur) timeLimit = Math.max(timeLimit, 30);
    timeLimit += ctx.rodTimeBonus || 0;
    if (ctx.zenMode) timeLimit = Infinity;
    return { requiredAnswers, timeLimit };
  },
  applyRewardModifiers(
    baseReward: { value: number; xp: number },
    ctx: ModifierCtx
  ) {
    const { value, xp } = baseReward;
    const xpMultiplier = 1;
    return {
      value,
      xp,
      xpMultiplier,
      specialEvent: ctx.specialOnCatch || null,
    };
  },
};
