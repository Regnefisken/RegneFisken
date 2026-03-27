import type { XpBalancing, XpRewardsConfig } from '../types/game.js';

export const XP_REWARDS: XpRewardsConfig = {
  fish: { Almindelig: 10, Sjælden: 25, Legendarisk: 60 },
  item: { treasure: 80, junk: 2 },
};

/** Deaktiveret i legacy — beholdt for API-kompatibilitet. */
export function xpWeightBonus(_weight: number): number {
  void _weight;
  return 0;
}

export const XP_BALANCING = { baseXp: 100, linearStep: 75, exponentialFrom: 10, exponentialRate: 1.06 } as const satisfies XpBalancing;

export function xpNeededForLevel(lvl: number): number {
  const { baseXp, linearStep, exponentialFrom, exponentialRate } = XP_BALANCING;
  const linear = baseXp + (lvl - 1) * linearStep;
  if (lvl <= exponentialFrom) return linear;
  return Math.floor(linear * Math.pow(exponentialRate, lvl - exponentialFrom));
}
