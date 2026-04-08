import { WARDROBE_ITEMS } from '../data/wardrobeItems.generated.js';

export type WardrobeRarityTier = 'common' | 'rare' | 'legendary';

/** Puljer matcher kiste-fangster (fish.id / fishModelId). */
export const SUNKET_CHEST_FISH_IDS = [
  'sunket_kiste_lille',
  'sunket_kiste',
  'sunket_kiste_stor',
] as const;

export const CHEST_FISH_TO_WARDROBE_TIER: Record<string, WardrobeRarityTier> = {
  sunket_kiste_lille: 'common',
  sunket_kiste: 'rare',
  sunket_kiste_stor: 'legendary',
};

/** Basis-mønt fra fiskedata (før streak) — til dobbelt-penge-trøst. */
export const CHEST_BASE_COINS: Record<string, number> = {
  sunket_kiste_lille: 50,
  sunket_kiste: 100,
  sunket_kiste_stor: 200,
};

export function isSunketChestFishId(id: string | undefined): id is (typeof SUNKET_CHEST_FISH_IDS)[number] {
  return id !== undefined && (CHEST_FISH_TO_WARDROBE_TIER as Record<string, WardrobeRarityTier>)[id] !== undefined;
}

/**
 * §6 — **Valg A:** RNG ved knaptryk «Åbn kisten» (maks spænding).
 *
 * §5 — Dobbelt penge ganger **kun kiste-basisbeløbet** (før streak). Streak lægges til i `finalizeCatch` som i dag.
 *
 * 25 %: uniformt item fra restpulje i tier, **eller** hvis puljen er tom → `doubleBaseCoins` (ingen «død» 25 %).
 * 75 %: ingen ekstra bonus (basis + streak uændret).
 */
export function rollChestWardrobeBonus(
  fishModelId: string,
  ownedIds: ReadonlySet<string>,
  random: () => number,
):
  | { kind: 'item'; itemId: string }
  | { kind: 'doubleBaseCoins' }
  | { kind: 'none' } {
  const tier = CHEST_FISH_TO_WARDROBE_TIER[fishModelId];
  if (!tier) return { kind: 'none' };

  const pool = WARDROBE_ITEMS.filter((i) => i.rarity === tier && !ownedIds.has(i.id)).map((i) => i.id);

  if (random() >= 0.25) return { kind: 'none' };

  if (pool.length > 0) {
    const pick = pool[Math.floor(random() * pool.length)]!;
    return { kind: 'item', itemId: pick };
  }

  return { kind: 'doubleBaseCoins' };
}
