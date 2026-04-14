import type { RollCatchResult } from '../types/fish.js';

/** Spand-kapacitet og spand-liste: ekskluder quest-samleobjekter der håndteres via Skatte/Kiste. */
export function countsTowardBucketCapacity(f: Pick<RollCatchResult, 'itemType'>): boolean {
  return (
    f.itemType !== 'plesiosaur' &&
    f.itemType !== 'fossil' &&
    f.itemType !== 'conch' &&
    f.itemType !== 'crystal_junk'
  );
}

/** Synlige rækker i spand-panelet (plesiosaur bor i spanden men vises ikke på listen). */
export function isListedInBucketInventory(f: Pick<RollCatchResult, 'itemType'>): boolean {
  return (
    f.itemType !== 'plesiosaur' &&
    f.itemType !== 'fossil' &&
    f.itemType !== 'conch' &&
    f.itemType !== 'crystal_junk'
  );
}

export function inventoryBucketCount(inv: Pick<RollCatchResult, 'itemType'>[]): number {
  return inv.filter(countsTowardBucketCapacity).length;
}
