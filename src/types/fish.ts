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
  | 'pearl'
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
  | 'whip'
  | 'veil'
  | 'lyre'
  | 'scalloped'
  | 'paddle'
  | 'ribbon'
  | 'heart'
  | 'sail'
  | 'kraken';

/** Rygfinne-variant (ExtrudeGeometry). Uden felt: eksisterende cone-/flag-logik. */
export type DorsalFinType =
  | 'standard'
  | 'shark'
  | 'spiked'
  | 'double'
  | 'mohawk'
  | 'crown'
  | 'tentacles';

export type EyePupilShape =
  | 'sphere'
  | 'round'
  | 'vertical_slit'
  | 'horizontal_slit'
  | 'diamond'
  | 'star'
  | 'heart'
  | 'crescent'
  | 'cross';

export interface EyeConfig {
  size?: number;
  scleraColor?: number;
  pupilColor?: number;
  pupilShape?: EyePupilShape;
  pupilScale?: number;
  pupilDepth?: number;
  offsetX?: number;
  offsetY?: number;
}

export type TeethType = 'shark_double' | 'fangs' | 'tiny' | 'tusks';

export interface TeethConfig {
  type: TeethType;
  count?: number;
  size?: number;
  color?: number;
  zOffset?: number;
}

export type MouthType = 'none' | 'wide_shark' | 'round_sucker' | 'underbite' | 'beak';

/** Procedurale kropsmønstre (canvas-tekstur på standard fisk). `solid` = ingen mønster. */
export type BodyPattern =
  | 'solid'
  | 'stripes'
  | 'hstripes'
  | 'waves'
  | 'spots'
  | 'koi'
  | 'trout'
  | 'scales'
  | 'marble'
  | 'labyrinth'
  | 'leopard'
  | 'net'
  | 'neon'
  | 'bicolor'
  | 'ocellus';

/** Fire farvestop til ryg→bug gradient på standard fisk (canvas-tekstur). */
export interface ColorGradientStops {
  back: number;
  mid1: number;
  mid2: number;
  belly: number;
}

/** Metallisk glimmer (emissive-pletter + materiale). `amount === 0` = ingen effekt. */
export interface GlimmerConfig {
  amount: number;
  color: number;
  /** 0–1 — styrer pseudo-tilfældig placering af pletter (andre frø til samme krop/finne). */
  placement?: number;
}

/** Lysende midterlinje på kroppen (kun StandardFishModel). `enabled: false` = ingen effekt. */
export interface BioluminescentConfig {
  enabled: boolean;
  color: number;
  /** 0–3 — pulserende emissiv intensitet. */
  intensity: number;
}

/** Kuglefisk-oppustning + pigge (kun StandardFishModel). */
export interface PufferInflationConfig {
  /** 0–1 — skalerer krop X/Y med `1 + puff * 0.82`. */
  puff: number;
  /** 0.3–1.5 — antal/placering af pigge (tæthed). */
  spikeDensity: number;
}

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
  /** Tilpassede øjne (kun StandardFishModel). Uden felt: klassisk tre-lags øje. */
  eyeConfig?: EyeConfig;
  /** Proceduralt kropsmønster. Uden felt eller `solid`: klassisk skæl-tekstur. */
  bodyPattern?: BodyPattern;
  /** Hex — mønsteret tegnes med denne farve oven på kropsfarven. */
  patternColor?: number;
  /** 0.3–4.0 — tæthed/størrelse på mønsteret (højere = finere/tættere). */
  patternDensity?: number;
  /** Fire farvestop ryg → bug på krops-tekstur (linear gradient). `useRainbow` tilsidesætter med spektral-regnbue. */
  colorGradient?: ColorGradientStops;
  /** Spektral-regnbue på kroppen i stedet for `color`/`colorGradient`. */
  useRainbow?: boolean;
  /** Animeret HSL-farveskift på kropsmaterialet (useFrame). */
  chameleonMode?: boolean;
  /** 0.05–1.0 — krop gennemsigtighed (glas/gelé). Uden felt: 1.0 (uændret udseende). */
  bodyOpacity?: number;
  /** 0.1–1.0 — finner/hale/dorsal m.m. Uden felt: uændret (≈0.95+ = opak som før). */
  finOpacity?: number;
  /** Glimmer på krop (bump + metalness-variation + spekulær farvetone). Uden felt / amount 0: uændret. */
  glimmer?: GlimmerConfig;
  /** Glimmer på finner (samme princip som glimmer). */
  finGlimmer?: GlimmerConfig;
  /** Tænder (kun StandardFishModel). `false` / udefineret: ingen ekstra tænder. */
  teeth?: boolean | TeethConfig;
  /** Mund-variant (overlay). `none` / udefineret: ingen mund-mesh. */
  mouthType?: MouthType;
  /** 0.12–1 — hvor åben munden vises (gælder mouthType). */
  mouthOpenness?: number;
  /** Hex — mund / læber / sugende ring. */
  mouthColor?: number;
  /** Rygfinne-form. Uden felt: klassisk cone ved finUp/shark/spikes. */
  dorsalFinType?: DorsalFinType;
  /** 0–0.35 — sænker rygfinnen ned i kroppen. */
  dorsalFinEmbed?: number;
  /** 0.6–1.9 — skalering af hele hale-sektionen. Uden felt: 1.0. */
  tailScale?: number;
  /** 0.6–1.9 — pectoral sidefinner. Uden felt: 1.0. */
  sideFinScale?: number;
  /** Ekstra bughfinner. */
  showPelvicFins?: boolean;
  /** Skalering af bughfinner (gælder når showPelvicFins). */
  pelvicFinScale?: number;
  /** Separat fin-farve (alle finner). Uden felt: kropsfarve / redFins. */
  finColor?: number;
  /** Bioluminescens langs kroppens linje (emissiveMap + puls). Udefineret: ingen effekt. */
  bioluminescent?: BioluminescentConfig;
  /** Elektriske gnist-partikler omkring kroppen. */
  electricSparks?: boolean;
  /** Lyn-linjer fra kroppen (zigzag, flimrende). */
  electricBolts?: boolean;
  /** Pufferfish-oppustning og instanserede pigge. Udefineret: normal krop. */
  pufferInflation?: PufferInflationConfig;
  /** Per-del position/skala i editoren (optional; tom objekt udelades ved eksport). */
  partAdjustments?: {
    [partName: string]: {
      dx?: number;
      dy?: number;
      dz?: number;
      sx?: number;
      sy?: number;
      sz?: number;
      /** Euler-vinkel pr. akse i radianer (samme som `THREE.Group.rotation`). */
      rx?: number;
      ry?: number;
      rz?: number;
    };
  };
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
  /** Legacy enriched `visualScale` (fx sunket kister). */
  visualScale?: number;
  xpReward?: number;
}
