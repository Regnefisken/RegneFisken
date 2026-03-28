import { ENRICHED_CATCH_DATA } from '../data/enrichment.js';
import type { RollCatchResult } from '../types/fish.js';

/** Som legacy `buildBucket` / `animateFishToBucket`. */
export const BUCKET_INNER_RADIUS = 0.48;
export const BUCKET_VISUAL_HEIGHT = 0.9;
export const MAX_BUCKET_SCALE = 0.55;

export function catchDataNeedsBucketScaleCap(catchData: RollCatchResult): boolean {
  if (catchData.rarity === 'Legendarisk') return true;
  const enriched = catchData.fishModelId
    ? ENRICHED_CATCH_DATA.find((e) => e.id === catchData.fishModelId)
    : undefined;
  const m = enriched?.model;
  if (m && m.maxDisplayScale != null && m.maxDisplayScale > 2.0) return true;
  if (m && m.scale != null && m.scale > 1.8) return true;
  return false;
}

/** Grov basis-skala før `* 0.4` (matcher legacy `preBucketScale` for vores enkle modeller). */
export function baseCatchModelScale(fish: RollCatchResult): number {
  switch (fish.itemType) {
    case 'kraken':
    case 'soeuhyre':
      return 0.5;
    case 'jellyfish':
      return 0.42;
    case 'halibut':
      return 0.48;
    default:
      return 0.55;
  }
}

export function computeBucketScalar(fish: RollCatchResult): number {
  const pre = baseCatchModelScale(fish) * (fish.itemType === 'treasure' ? (fish.visualScale ?? 1) : 1);
  const uncapped = pre * 0.4;
  return catchDataNeedsBucketScaleCap(fish) ? Math.min(uncapped, MAX_BUCKET_SCALE) : uncapped;
}
