import { ENRICHED_CATCH_DATA } from '../data/enrichment.js';
import type { EnrichedCatchEntry, RollCatchResult } from '../types/fish.js';

/** Legacy `calculateDisplayScale` — fangst-størrelse fra vægt + model/rarity. */
export function calculateDisplayScale(
  entry: EnrichedCatchEntry | null | undefined,
  actualWeight: number,
): number {
  if (!entry?.model) return 1.0;

  const baseScale = entry.model.scale ?? 1.0;
  const avgWeight = (entry.baseWeightMin + entry.baseWeightMax) / 2 || 10;

  let ratio = actualWeight / avgWeight;

  const curve =
    entry.model.scaleCurve ??
    (entry.isTrueBoss ||
    entry.rarity === 'Legendarisk' ||
    entry.rarity === 'Forhistorisk'
      ? 0.58
      : 0.82);
  ratio = Math.pow(ratio, curve);

  let scale = baseScale * ratio;

  let maxScale = entry.model.maxDisplayScale;
  if (maxScale === undefined) {
    maxScale =
      (
        {
          Almindelig: 2.15,
          Sjælden: 2.55,
          Legendarisk: 2.95,
          Boss: 5.15,
          Forhistorisk: 3.45,
          Mystisk: 2.75,
        } as Record<string, number>
      )[entry.rarity] ?? 2.85;
  }

  scale = Math.min(scale, maxScale);
  scale = Math.max(scale, baseScale * 0.58);

  return scale;
}

export function getEnrichedEntry(id: string | undefined): EnrichedCatchEntry | null {
  if (!id) return null;
  return ENRICHED_CATCH_DATA.find((e) => e.id === id) ?? null;
}

/**
 * Skala til display (krog/fangst) — enriched entry + `calculateDisplayScale`,
 * ellers legacy fallback fra `createCatchModel` (inkl. halv skala for plesiosaur).
 */
export function displayScaleForCatch(fish: RollCatchResult): number {
  const caughtEntry = getEnrichedEntry(fish.fishModelId);
  if (fish.itemType === 'treasure' && fish.visualScale != null) {
    return fish.visualScale;
  }
  if (caughtEntry?.model) {
    /* Én konsistent størrelse efter fangst — undgår "lille" model ved lav vægt + matcher ét legacy-display. */
    if (fish.itemType === 'axolotl') {
      const mid = (caughtEntry.baseWeightMin + caughtEntry.baseWeightMax) / 2;
      return calculateDisplayScale(caughtEntry, mid);
    }
    return calculateDisplayScale(caughtEntry, fish.weight);
  }
  const baseScale = Math.min(0.5 + fish.weight / 30, 2.85);
  return fish.itemType === 'plesiosaur' ? baseScale * 0.5 : baseScale;
}
