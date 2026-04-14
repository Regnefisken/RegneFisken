import { ENRICHED_CATCH_DATA } from '../data/enrichment.js';
import type { EnrichedCatchEntry, RollCatchResult } from '../types/fish.js';

/** Absolut gulv for display-scale (relativt gulv `baseScale * 0.58` bevares også). */
export const MIN_DISPLAY_SCALE = 0.7;

/**
 * Flaskepost: uden clamp varierer display-scale stærkt med vægt (typ. ~0,58–1,75).
 * Strammer intervallet så flasken sjældent føles for lille eller for dominerende.
 */
const FLASKEPOST_DISPLAY_SCALE_MIN = 0.76;
const FLASKEPOST_DISPLAY_SCALE_MAX = 1.18;

/** Skal matche `PlesiosaurusCatchModel` root `<group scale={…}>` — legacy satte én root-scale, vi har indre × ydre. */
const PLESIO_HOOKED_INNER_SCALE = 0.055;

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
  scale = Math.max(scale, MIN_DISPLAY_SCALE);

  if (entry.id === 'flaskepost') {
    scale = Math.min(
      Math.max(scale, FLASKEPOST_DISPLAY_SCALE_MIN),
      FLASKEPOST_DISPLAY_SCALE_MAX,
    );
  }

  return scale;
}

export function getEnrichedEntry(id: string | undefined): EnrichedCatchEntry | null {
  if (!id) return null;
  return ENRICHED_CATCH_DATA.find((e) => e.id === id) ?? null;
}

/**
 * Skala til display (krog/fangst) — enriched entry + `calculateDisplayScale`,
 * ellers legacy fallback fra `createCatchModel`.
 *
 * Plesiosaurus: legacy `createCatchModel` satte root-scale til `calculateDisplayScale` (erstattede indre 0.055).
 * React beholder indre 0.055 i `PlesiosaurusCatchModel`, så ydre skala = legacyRoot / 0.055.
 */
export function displayScaleForCatch(fish: RollCatchResult): number {
  if (fish.itemType === 'treasure' && fish.visualScale != null) {
    return fish.visualScale;
  }

  if (fish.itemType === 'plesiosaur') {
    const entry =
      getEnrichedEntry(fish.fishModelId) ?? getEnrichedEntry('fisk_plesiosaurus');
    if (entry?.model) {
      const legacyRootScale = calculateDisplayScale(entry, fish.weight);
      return legacyRootScale / PLESIO_HOOKED_INNER_SCALE;
    }
    const baseScale = Math.min(0.5 + fish.weight / 30, 2.85);
    return (baseScale * 0.5) / PLESIO_HOOKED_INNER_SCALE;
  }

  const caughtEntry = getEnrichedEntry(fish.fishModelId);
  if (caughtEntry?.model) {
    /* Én konsistent størrelse efter fangst — undgår "lille" model ved lav vægt + matcher ét legacy-display. */
    if (fish.itemType === 'axolotl') {
      const mid = (caughtEntry.baseWeightMin + caughtEntry.baseWeightMax) / 2;
      return calculateDisplayScale(caughtEntry, mid);
    }
    return calculateDisplayScale(caughtEntry, fish.weight);
  }
  const baseScale = Math.min(0.5 + fish.weight / 30, 2.85);
  return baseScale;
}
