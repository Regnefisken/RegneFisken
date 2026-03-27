import type { BucketTier, RodTier } from '../types/shop.js';

export const BUCKET_TIERS: BucketTier[] = [
  { id: null,            name: 'Træspand',     capacity: 5,  color: 0x8b6540, metalness: 0.05, roughness: 0.95, icon: '🪣', category: 'udstyr' },
  { id: 'bucket_iron',   name: 'Jernspand',    capacity: 10, color: 0x5a5a6a, metalness: 0.8,  roughness: 0.35, icon: '🪣', category: 'udstyr' },
  { id: 'bucket_copper', name: 'Kobberspand',  capacity: 15, color: 0xb87333, metalness: 0.7,  roughness: 0.4,  icon: '🪣', category: 'udstyr' },
  { id: 'bucket_silver', name: 'Sølvspand',    capacity: 20, color: 0xc0c0d0, metalness: 0.9,  roughness: 0.2,  icon: '🪣', category: 'udstyr' },
  { id: 'bucket_gold',   name: 'Guldspand',    capacity: 25, color: 0xffd700, metalness: 1.0,  roughness: 0.1,  icon: '🪣', category: 'udstyr' },
];

export const ROD_TIERS: RodTier[] = [
  { id: null,           name: 'Klassisk',   timeBonus: 0, rodColor: 0x8b6540, gripColor: 0x6b4a2e, seatColor: 0xcccccc, reelBase: 0x8b5a2b, spoolColor: 0xff8c00, metalness: 0.1, icon: '🎣', category: 'udstyr' },
  { id: 'rod_havblaa',  name: 'Havblå',     timeBonus: 2, rodColor: 0x243e60, gripColor: 0x1b2d47, seatColor: 0xdddddd, reelBase: 0x188a85, spoolColor: 0x3ac2bd, metalness: 0.2, icon: '🌊', category: 'udstyr' },
  { id: 'rod_bambus',   name: 'Bambus',     timeBonus: 5, rodColor: 0xe0c08b, gripColor: 0xceab70, seatColor: 0xffffff, reelBase: 0xdeaa73, spoolColor: 0xf26666, metalness: 0.1, icon: '🎍', category: 'udstyr' },
  { id: 'rod_mahogni',  name: 'Mahogni',    timeBonus: 9, rodColor: 0x6b2b2b, gripColor: 0x4a1818, seatColor: 0xc87d4a, reelBase: 0x5a3e2b, spoolColor: 0x4a9e5b, metalness: 0.3, icon: '✨', category: 'udstyr' },
];

export function getBucketTier(upgrades: string[]): BucketTier {
  for (let i = BUCKET_TIERS.length - 1; i >= 1; i--) {
    const id = BUCKET_TIERS[i].id;
    if (id != null && upgrades.includes(id)) return BUCKET_TIERS[i];
  }
  return BUCKET_TIERS[0];
}

export function getRodTier(upgrades: string[]): RodTier {
  for (let i = ROD_TIERS.length - 1; i >= 1; i--) {
    const id = ROD_TIERS[i].id;
    if (id != null && upgrades.includes(id)) return ROD_TIERS[i];
  }
  return ROD_TIERS[0];
}
