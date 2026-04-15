/**
 * Naturlige fangstrater for NPC-samleobjekter (fossil, konkylie, perle/østers, sardin)
 * sænkes først efter at spilleren har afleveret mindst {@link NPC_COLLECTIBLE_DELIVERY_THRESHOLD}
 * til den pågældende NPC — ikke ved 1/10 eller 5/10.
 *
 * Konsum-madding (konkylie-, fossil-, perlelim) er immun: se `catch-engine.ts`.
 */
export const NPC_COLLECTIBLE_DELIVERY_THRESHOLD = 10;

/** Faktor på naturlig sandsynlighed når `delivered >= threshold` (kan justeres ved nye milepæle). */
export const POST_THRESHOLD_COLLECTIBLE_RATE_MULTIPLIER = 0.3;

export function naturalCollectibleRateMultiplier(deliveredCount: number): number {
  if (deliveredCount < NPC_COLLECTIBLE_DELIVERY_THRESHOLD) return 1;
  return POST_THRESHOLD_COLLECTIBLE_RATE_MULTIPLIER;
}
