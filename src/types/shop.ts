export type ShopCategory =
  | 'fishing_gear'
  | 'travel'
  | 'legendary'
  | 'bait';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  requiredLevel: number;
  requiresUpgrade?: string | null;
  requiresQuestItem?: string;
  category: ShopCategory | string;
  consumable?: boolean;
  duration?: number;
  permanent?: boolean;
}

export interface BucketTier {
  id: string | null;
  name: string;
  capacity: number;
  color: number;
  metalness: number;
  roughness: number;
  icon: string;
  category: string;
}

export interface RodTier {
  id: string | null;
  name: string;
  timeBonus: number;
  rodColor: number;
  gripColor: number;
  seatColor: number;
  reelBase: number;
  spoolColor: number;
  metalness: number;
  icon: string;
  category: string;
}
