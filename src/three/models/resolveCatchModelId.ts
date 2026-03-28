import type { RollCatchResult } from '../../types/fish.js';

/** Kartlægger runtime-fangst til CUTE_FISH_CONFIG id (som legacy buildCuteFishModel). */
export function resolveCuteFishId(fish: RollCatchResult): string | null {
  if (fish.fishModelId) return fish.fishModelId;
  switch (fish.itemType) {
    case 'bottle':
      return 'flaskepost';
    case 'fossil':
      return 'fossil';
    case 'conch':
      return 'konkylie';
    case 'oyster':
      return 'oyster';
    case 'boss_hvidhaj':
      return 'fisk_hvidhaj';
    case 'soeuhyre':
      return 'fisk_soeuhyre';
    default:
      return null;
  }
}
