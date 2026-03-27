/** Rariteter og særlige etiketter brugt i CATCH_MASTER_DATA. */
export type CatchRarity =
  | 'Almindelig'
  | 'Sjælden'
  | 'Legendarisk'
  | 'Mystisk'
  | 'Forhistorisk'
  | 'Boss'
  | 'Quest'
  | 'Fare';

export type CatchType = 'fish' | 'special' | 'quest' | 'danger' | 'treasure' | 'boss';

export type CatchItemType =
  | 'fish'
  | 'piranha'
  | 'boss'
  | 'junk'
  | 'frog'
  | 'starfish'
  | 'halibut'
  | 'plesiosaur'
  | 'axolotl'
  | 'gnavne_gorm'
  | 'golden_frog'
  | 'boss_hvidhaj'
  | 'crystal_junk'
  | 'bottle'
  | 'fossil'
  | 'conch'
  | 'jellyfish'
  | 'cabin_key'
  | 'treasure'
  | 'kraken'
  | 'oyster'
  | 'soeuhyre'
  | string;

export type TailType =
  | 'standard'
  | 'forked'
  | 'flat'
  | 'eel'
  | 'thin'
  | 'chunky'
  | 'star'
  | 'none'
  | 'shark'
  | 'dino'
  | 'whip';

export interface FishModelConfig {
  color: number | null;
  bodyShape: [number, number, number];
  tail: TailType;
  speed: number;
  scale: number;
  flat?: boolean;
  spots?: number | boolean;
  stripes?: boolean;
  redFins?: boolean;
  isEel?: boolean;
  isFrog?: boolean;
  isStarfish?: boolean;
  longBeak?: boolean;
  spikes?: boolean;
  uglyHead?: boolean;
  isPiranha?: boolean;
  maxDisplayScale?: number;
  scaleCurve?: number;
  finUp?: boolean;
  sword?: boolean;
  emissive?: number;
  emissiveIntensity?: number;
  isGoldenCarp?: boolean;
  metalness?: number;
  roughness?: number;
  isCrab?: boolean;
  thinLegs?: boolean;
  lure?: boolean;
  whiskers?: boolean;
  isOctopus?: boolean;
  bellyColor?: number;
  isWhiteShark?: boolean;
  isDino?: boolean;
  isLobster?: boolean;
  isRay?: boolean;
  isBossGorm?: boolean;
  isGoldenFrog?: boolean;
  noEyes?: boolean;
  openAngle?: number;
  hasPearl?: boolean;
  isOyster?: boolean;
  isKey?: boolean;
  isBottle?: boolean;
  isFossil?: boolean;
  isConch?: boolean;
}

export interface CatchRequirements {
  requiredRod: string | null;
  requiredBait: string | null;
  requiredUpgrade?: string;
}

export interface CatchMasterEntry {
  id: string;
  name: string;
  type: CatchType | string;
  rarity: CatchRarity | string;
  primaryAreas: string[];
  requirements: CatchRequirements;
  itemType: CatchItemType;
  lootWeight?: number;
  model: FishModelConfig | null;
  visual?: string;
  visualScale?: number;
  weightRange?: [number, number];
  value?: number;
  xpReward?: number;
  specialOnCatch?: string;
}

export interface FishDatabaseRow {
  id: string;
  name: string;
  rarity: string;
  primaryAreas: string[];
  requirements: CatchRequirements;
  itemType: string;
}

export interface FishSpeciesBuckets {
  Almindelig: string[];
  Sjælden: string[];
  Legendarisk: string[];
  Mystisk: string[];
  Forhistorisk: string[];
  Boss: string[];
  Quest: string[];
  Fare: string[];
}

export interface FightParams {
  requiredAnswers: number;
  baseTimeLimit: number;
}

export interface EnrichedCatchEntry
  extends Omit<CatchMasterEntry, 'specialOnCatch' | 'weightRange'> {
  isTrueBoss: boolean;
  locations: string[];
  baseWeightMin: number;
  baseWeightMax: number;
  baseValue: number;
  baseXP: number;
  baseDR: number;
  weightRange: [number, number];
  fightParams: FightParams;
  specialOnCatch: string | null;
  lootWeight: number;
}

/** Runtime-fangst (krog, spand, sidste fangst) — matcher legacy rollForCatch-output */
export interface RollCatchResult {
  id: string;
  fishModelId?: string;
  species: string;
  weight: number;
  value: number;
  rarity: string;
  color: number;
  itemType: string;
  visual?: string;
  xpReward?: number;
}
