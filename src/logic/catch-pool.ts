import { ENRICHED_CATCH_DATA, matchesLocation } from '../data/enrichment.js';
import type { EnrichedCatchEntry, RollCatchResult } from '../types/fish.js';
import { rollFrogCatchColor } from '../three/models/cuteFishUtils.js';

/** Minimal `RollCatchResult` til preload (som legacy `buildCatchDataFromFishId`). */
export function buildCatchDataFromFishId(fishId: string): RollCatchResult {
  const entry = ENRICHED_CATCH_DATA.find((e) => e.id === fishId);
  if (entry) {
    const [minW, maxW] = entry.weightRange;
    return {
      id: `preload-${fishId}`,
      fishModelId: fishId,
      itemType: entry.itemType,
      weight: (minW + maxW) / 2,
      species: entry.name,
      rarity: entry.rarity,
      color: fishId === 'fisk_frø' ? rollFrogCatchColor() : (entry.model?.color ?? 0x888888),
      value: entry.baseValue ?? 0,
    };
  }
  return {
    id: `preload-${fishId}`,
    fishModelId: fishId,
    itemType: fishId,
    weight: 1,
    species: fishId,
    rarity: 'Almindelig',
    color: 0x888888,
    value: 0,
  };
}

/** Alle entries med 3D-model (e.l.) for lokation + upgrades — legacy `getPreloadCandidates`. */
export function getPreloadCandidates(
  location: string,
  upgrades: string[],
): EnrichedCatchEntry[] {
  return ENRICHED_CATCH_DATA.filter((e) => {
    if (!matchesLocation(e, location)) return false;
    const req = e.requirements || {};
    if (req.requiredRod && !upgrades.includes(req.requiredRod)) return false;
    if (req.requiredUpgrade && !upgrades.includes(req.requiredUpgrade)) return false;
    if (e.model || e.visual) return true;
    if (
      e.itemType === 'fish' ||
      e.itemType === 'treasure' ||
      e.itemType === 'kraken' ||
      e.itemType === 'jellyfish' ||
      e.itemType === 'bottle' ||
      e.itemType === 'fossil' ||
      e.itemType === 'oyster' ||
      e.itemType === 'conch' ||
      e.itemType === 'sardine' ||
      e.itemType === 'plesiosaur' ||
      e.itemType === 'boss_hvidhaj' ||
      e.itemType === 'halibut' ||
      e.itemType === 'crystal_junk' ||
      e.itemType === 'junk' ||
      e.itemType === 'piranha' ||
      e.itemType === 'soeuhyre'
    ) {
      return true;
    }
    return false;
  });
}

const MAX_LRU = 40;

/** Touch id i LRU-listen (nyeste sidst); evict fra start ved overflow. */
export function touchLruFishIds(prev: string[], id: string): string[] {
  const next = prev.filter((x) => x !== id);
  next.push(id);
  while (next.length > MAX_LRU) next.shift();
  return next;
}

export function topPreloadFishIds(location: string, upgrades: string[], topN = 12): string[] {
  const candidates = getPreloadCandidates(location, upgrades);
  const sorted = [...candidates].sort((a, b) => (b.lootWeight || 1) - (a.lootWeight || 1));
  return sorted.slice(0, topN).map((e) => e.id);
}
