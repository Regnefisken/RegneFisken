import type { RollCatchResult } from '../types/fish';

export type FangetBadge = { label: string; className: string };

/** Tailwind-klasser til pill-badge ud fra dansk sjældenhedsstreng. */
export function fangetBadgeClassForRarity(rarity: string): string {
  switch (rarity) {
    case 'Sjælden':
      return 'bg-sky-600 text-white';
    case 'Legendarisk':
      return 'bg-purple-600 text-white';
    case 'Mystisk':
    case 'Forhistorisk':
      return 'bg-fuchsia-700 text-white';
    case 'Boss':
      return 'bg-red-700 text-white';
    case 'Quest':
      return 'bg-amber-600 text-black';
    case 'Fare':
      return 'bg-orange-600 text-white';
    default:
      return 'bg-sky-500 text-white';
  }
}

export function fangetBadgeForCatch(fish: RollCatchResult): FangetBadge {
  if (fish.itemType === 'treasure') {
    return { label: '💎 Jackpot!', className: 'bg-yellow-500 text-black' };
  }
  if (fish.itemType === 'junk') {
    return { label: '🗑 UPSI!', className: 'bg-stone-600 text-stone-200' };
  }
  if (fish.rarity === 'Almindelig') {
    return { label: '🏆 Fanget!', className: 'bg-sky-500 text-white' };
  }
  return {
    label: `${fish.rarity} fangst!`,
    className: fangetBadgeClassForRarity(fish.rarity),
  };
}

/** Svag linear-gradient top (hex) på standard fangst-overlay. */
export function catchPanelGradTop(fish: RollCatchResult): string {
  if (fish.itemType === 'treasure') return '#eab308';
  if (fish.itemType === 'junk') return '#44403c';
  switch (fish.rarity) {
    case 'Legendarisk':
      return '#9333ea';
    case 'Sjælden':
      return '#0284c7';
    case 'Mystisk':
    case 'Forhistorisk':
      return '#a21caf';
    case 'Boss':
      return '#b91c1c';
    case 'Quest':
      return '#d97706';
    case 'Fare':
      return '#ea580c';
    default:
      return '#0284c7';
  }
}
