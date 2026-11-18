import { getRodTier } from '../data/equipment.js';
import type { EnrichedCatchEntry } from '../types/fish.js';

/** Tid pr. regnestykke, når fangsten ikke har sin egen tidsgrænse (`fightParams.baseTimeLimit`). */
export const DEFAULT_FIGHT_TIME_SEC = 25;

/**
 * Sekunder til ét regnestykke i en kamp: fangstens egen tidsgrænse (ellers 25 s) plus stangens
 * tidsbonus (Havblå +2, Bambus +5, Mahogni +9 — `timeBonus` i `ROD_TIERS`), som udstyrsfanen viser.
 */
export function fightTimeLimitSec(
  entry: Pick<EnrichedCatchEntry, 'fightParams'> | undefined,
  upgrades: string[],
): number {
  const base = entry?.fightParams?.baseTimeLimit || DEFAULT_FIGHT_TIME_SEC;
  return base + getRodTier(upgrades).timeBonus;
}
