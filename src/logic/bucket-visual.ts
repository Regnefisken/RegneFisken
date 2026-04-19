import { ENRICHED_CATCH_DATA } from '../data/enrichment.js';
import type { RollCatchResult } from '../types/fish.js';

/** Som legacy `buildBucket` / `animateFishToBucket`. */
export const BUCKET_INNER_RADIUS = 0.48;
export const BUCKET_VISUAL_HEIGHT = 0.9;
export const MAX_BUCKET_SCALE = 0.55;

/** Vandoverflade (y) i spandens lokale rum. `Bucket.tsx`: cylinder-højde = dette minus `waterBottomPad` (0,015). */
export const WATER_SURFACE_Y_LOCAL = 0.596;
/** Vandcylinder + overflade-disk; inde i væggen. Bruges også til splash / fiske-loft (samme Y som overflade). */
export const BUCKET_WATER_RADIUS = 0.408;
/** Lodrette fiske-stak (synlig FIFO) — afstemt så centre + bob ikke bryder vandoverfladen. */
export const BUCKET_FISH_Y_BASE = 0.24;
export const BUCKET_STACK_STEP = 0.027;
/** Max center-Y under overflade (world→local clamp); lidt luft til fin/mesh-top. */
export const BUCKET_FISH_SURFACE_CLEARANCE = 0.055;
/** Lodret flyde-bob (sinus); clampes mod vandoverfladen — skal være tydeligt vs. vandstand. */
export const BUCKET_FLOAT_BOB_AMPLITUDE = 0.11;
export const BUCKET_FLOAT_BOB_SPEED = 1.15;
/** Vandret “svaj” omkring landingspunkt (xz); clampes mod vandradius. */
export const BUCKET_FISH_DRIFT_AMPLITUDE = 0.048;
export const BUCKET_FISH_DRIFT_MAX_R_FACTOR = 0.88;

/** Små/korte modeller løftes så de ikke kun “ligger i bunden”; høje/brede når overfladen naturligt. */
export const BUCKET_CATCH_LIFT_REF_HEIGHT = 0.125;
export const BUCKET_CATCH_LIFT_GAIN = 1.15;
export const BUCKET_CATCH_LIFT_REF_SCALE = 0.42;
export const BUCKET_CATCH_LIFT_SCALE_GAIN = 0.32;
export const BUCKET_CATCH_LIFT_MAX = 0.165;

/**
 * Max halvdel af xz-footprint (efter skalering) — hypot(x,z)/2, så diagonale fisk ikke slipper ud.
 * Giver plads til landings-offset fra spandens midte (~0,48 indre radius ved typisk højde).
 */
export const BUCKET_CLIP_MAX_XZ_HALF = BUCKET_INNER_RADIUS * 0.43;
/** Max afstand fra spand-akse til fiskens center i xz: indre radius minus footprint + lidt luft. */
export const BUCKET_CENTER_MAX_RADIAL_FACTOR = 0.86;

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
