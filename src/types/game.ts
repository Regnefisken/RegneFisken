import type { LocationId } from './locations.js';

export type WeatherTypeId = 'CLEAR' | 'OVERCAST' | 'RAIN' | 'STORM' | 'FOG';

export interface WeatherType {
  id: string;
  name: string;
  icon: string;
  waveAmp: number;
  rain: boolean;
  storm: boolean;
  fogDens: number;
  lightMod: number;
}

export type WeatherTypesMap = Record<WeatherTypeId, WeatherType>;

export interface LocationSpecialRules {
  nothingChance: number;
  hasSeagulls?: boolean;
  fossilBonus?: number;
  plesioChance?: number;
  darkLocation?: boolean;
  requiresBambus?: boolean;
  turtleEgg?: boolean;
  requiresMahogni?: boolean;
  biolumBoost?: boolean;
  requiresHeadlamp?: boolean;
  noFishing?: boolean;
}

export interface LocationConfig {
  id: LocationId;
  name: string;
  emoji: string;
  unlockLevel: number;
  requiresItem: string | null;
  type: 'fishing' | 'base' | 'world';
  description: string;
  bgColor: number;
  waterColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  specialRules: LocationSpecialRules;
  collectibleTypes: string[];
  lockReason: string | null;
  travelRequires?: string;
  fishRequires?: string;
  bgOverride?: number;
  fogOverride?: number;
  requiresQuestItem?: string;
}

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface GraphicsTierConfig {
  segments: number;
  texSize: number;
  material: string;
  clearcoat: number;
  shimmer: number;
}

export type GraphicsConfigMap = Record<GraphicsQuality, GraphicsTierConfig>;

export interface PoolRarityWeights {
  Almindelig: number;
  Sjælden: number;
  Legendarisk: number;
  Mystisk: number;
}

export interface FightParamEntry {
  requiredAnswers: number;
  baseTimeLimit: number;
}

export type FightParamsMap = Record<string, FightParamEntry>;

export type SpecialOnCatchMap = Record<string, string>;

export interface DayNightPhase {
  name: string;
  time: number;
  lightColor: number;
  ambientColor: number;
  intensity: number;
  bgColor: number;
  fogColor: number;
  icon: string;
}

export interface DayNightCycle {
  duration: number;
  phases: DayNightPhase[];
}

export interface ParrotJoke {
  id: string;
  q: string;
  a: string;
}

export interface XpBalancing {
  baseXp: number;
  linearStep: number;
  exponentialFrom: number;
  exponentialRate: number;
}

export interface XpRewardsConfig {
  fish: { Almindelig: number; Sjælden: number; Legendarisk: number };
  item: { treasure: number; junk: number };
}
