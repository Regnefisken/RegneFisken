import type { CatchRarity } from '../types/fish.js';

const PALETTES: Record<string, number[]> = {
  Almindelig: [0x8faab3, 0x6b8e23, 0xa9a9a9],
  Sjælden: [0xff7f50, 0x4682b4, 0xcd853f],
  Legendarisk: [0xffd700, 0x9400d3, 0xdc143c],
};

/** Pipeline-nøgler → dansk rarity-streng (som i enriched data) */
export const RARITY_KEY_TO_LABEL: Record<string, CatchRarity | string> = {
  common: 'Almindelig',
  rare: 'Sjælden',
  legendary: 'Legendarisk',
  mystisk: 'Mystisk',
};

export function pickColor(rarity: string): number {
  const pal = PALETTES[rarity] ?? [0x888888];
  return pal[Math.floor(Math.random() * pal.length)];
}

/** DR-baseret rarity-vægte — kopi af legacy getRarityWeights */
export function getRarityWeights(level: number, additiveDR = 0) {
  const drBonus = additiveDR;
  const common = Math.max(5, 55 - drBonus * 0.2);
  const rare = Math.max(3, 3 + drBonus * 0.15 + Math.max(0, level - 3) * 2);
  const legendary = Math.max(1, 1 + drBonus * 0.08 + Math.max(0, level - 8) * 0.5);
  const mystisk = 1;
  return { common, rare, legendary, mystisk };
}

/** Samme rækkefølge som legacy (højeste tier først i fordelingen). */
export function rollRarityPipeline(w: Record<string, number>): string {
  const entries: [string, number][] = [
    ['mystisk', w.mystisk],
    ['legendary', w.legendary],
    ['rare', w.rare],
    ['common', w.common],
  ];
  const total = entries.reduce((s, [, v]) => s + v, 0);
  let roll = Math.random() * total;
  for (const [key, wt] of entries) {
    roll -= wt;
    if (roll <= 0) return key;
  }
  return 'common';
}
