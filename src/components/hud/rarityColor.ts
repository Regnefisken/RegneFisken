import type { RollCatchResult } from '../../types/fish';

export function rarityTextClass(fish: RollCatchResult | null): string {
  if (!fish) return 'text-white';
  if (fish.itemType === 'treasure') return 'text-yellow-300';
  if (fish.itemType === 'junk') return 'text-stone-400';
  if (fish.rarity === 'Legendarisk') return 'text-purple-300';
  if (fish.rarity === 'Sjælden') return 'text-sky-300';
  if (fish.rarity === 'Mystisk' || fish.rarity === 'Forhistorisk') return 'text-fuchsia-300';
  if (fish.rarity === 'Boss') return 'text-red-400';
  return 'text-white';
}
