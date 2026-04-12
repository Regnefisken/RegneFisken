import { LOCATION_DISPLAY } from '../../data/locations.js';
import type {
  CatchItemType,
  CatchRarity,
  DorsalFinType,
  FishBodyProfile,
  TailType,
} from '../../types/fish.js';

export const BODY_PROFILE_OPTIONS: readonly FishBodyProfile[] = [
  'standard',
  'tapered',
  'flatBelly',
  'tadpole',
  'boxfish',
  'ray',
] as const;

/** Kropsfacon (StandardFishModel) — danske etiketter. */
export const BODY_PROFILE_LABEL_DA: Record<FishBodyProfile, string> = {
  standard: 'Standard (symmetrisk)',
  tapered: 'Dråbeform (tun/laks)',
  flatBelly: 'Flad mave (haj/malle)',
  tadpole: 'Klokkeform (haletudse)',
  boxfish: 'Kassefisk',
  ray: 'Rocke (flad og bred)',
};

export const TAIL_TYPES: TailType[] = [
  'standard',
  'forked',
  'flat',
  'eel',
  'thin',
  'chunky',
  'star',
  'none',
  'shark',
  'dino',
  'whip',
  'veil',
  'lyre',
  'scalloped',
  'ribbon',
  'heart',
  'sail',
  'giantSail',
  'crescent',
  'sword',
  'doubleLobe',
  'sharkTail',
  'fan',
  'spade',
  'kraken',
];

/** Haleform-dropdown i editoren: kun disse kan vælges; andre værdier på eksisterende fisk vises som ekstra option. */
export const EDITOR_HALEFORM_TAIL_TYPES: readonly TailType[] = [
  'eel',
  'thin',
  'none',
  'veil',
  'lyre',
  'scalloped',
  'ribbon',
  'heart',
  'sail',
  'giantSail',
  'crescent',
  'sword',
  'doubleLobe',
  'sharkTail',
  'fan',
  'spade',
  'kraken',
];

export const DORSAL_FIN_TYPES: DorsalFinType[] = [
  'standard',
  'standardVersion2',
  'spiked',
  'spikedVersion2',
  'double',
  'doubleVersion2',
  'mohawk',
  'mohawkVersion2',
  'almindelig',
  'shark',
  'crown',
  'sailDorsal',
  'ragged',
  'wave',
];

/** Visningsnavne til hale-dropdown (værdi forbliver TailType). */
export const TAIL_TYPE_LABEL_DA: Record<TailType, string> = {
  standard: 'Standard',
  forked: 'Gaffelhale',
  flat: 'Flad',
  eel: 'Ål',
  thin: 'Tynd',
  chunky: 'Kraftig',
  star: 'Stjerne',
  none: 'Ingen',
  shark: 'Haj (kegle)',
  dino: 'Dino',
  whip: 'Pisk',
  veil: 'Veil Tail',
  lyre: 'Lyre Tail',
  scalloped: 'Scalloped',
  ribbon: 'Ribbon Tail',
  heart: 'Heart Tail',
  sail: 'Sail',
  giantSail: 'Giant Sail',
  crescent: 'Crescent',
  sword: 'Sword Tail',
  doubleLobe: 'Double Lobe',
  sharkTail: 'Shark Tail',
  fan: 'Fan Tail',
  spade: 'Spade Tail',
  kraken: 'Kraken',
};

/**
 * Haleformer der kun understøtter normal side-til-side hale-animation i modellen.
 * Må ikke kombineres med `tailFinMovement: 'paddle'` — bruges i fisk-editoren.
 */
export const TAIL_TYPES_INCOMPATIBLE_WITH_PADDLE_FIN_MOVEMENT: readonly TailType[] = [
  'veil',
  'scalloped',
  'doubleLobe',
  'sharkTail',
  'kraken',
] as const;

const TAIL_PADDLE_INCOMPATIBLE_SET = new Set<string>(TAIL_TYPES_INCOMPATIBLE_WITH_PADDLE_FIN_MOVEMENT);

/** Sandt når haleformen kun må bruges sammen med normal halefinne-bevægelse (ikke padlen op/ned). */
export function tailRequiresNormalSideFinMovement(tail: TailType): boolean {
  return TAIL_PADDLE_INCOMPATIBLE_SET.has(tail);
}

/** Danske visningsnavne til rygfinne-type (værdi forbliver DorsalFinType). */
export const DORSAL_FIN_LABEL_DA: Record<DorsalFinType, string> = {
  standard: 'Standard (trekant)',
  standardVersion2: 'Standard v2',
  spiked: 'Pigget',
  spikedVersion2: 'Pigget v2',
  double: 'Dobbel',
  doubleVersion2: 'Dobbel v2',
  mohawk: 'Mohawk',
  mohawkVersion2: 'Mohawk v2',
  almindelig: 'Almindelig (skæv)',
  shark: 'Haj (ryg)',
  crown: 'Krone',
  sailDorsal: 'Sejl (ryg)',
  ragged: 'Ternet / slidt',
  wave: 'Bølge',
};

export const RARITY_GROUPS: CatchRarity[] = [
  'Almindelig',
  'Sjælden',
  'Legendarisk',
  'Mystisk',
  'Forhistorisk',
  'Boss',
  'Quest',
  'Fare',
];

export const ITEM_TYPE_OPTIONS: CatchItemType[] = [
  'fish',
  'piranha',
  'boss',
  'junk',
  'frog',
  'starfish',
  'halibut',
  'plesiosaur',
  'axolotl',
  'gnavne_gorm',
  'golden_frog',
  'boss_hvidhaj',
  'crystal_junk',
  'bottle',
  'fossil',
  'conch',
  'pearl',
  'jellyfish',
  'cabin_key',
  'treasure',
  'kraken',
  'oyster',
  'soeuhyre',
];

/** Fangst-områder (primaryAreas) — danske navne som i spillet (`LOCATION_DISPLAY`). */
export const PRIMARY_AREA_OPTIONS = [
  { id: 'pier', label: LOCATION_DISPLAY.pier },
  { id: 'smaragd', label: LOCATION_DISPLAY.smaragd },
  { id: 'tropical_island', label: LOCATION_DISPLAY.tropical_island },
  { id: 'jungle_island', label: LOCATION_DISPLAY.jungle_island },
  { id: 'abyss', label: LOCATION_DISPLAY.abyss },
  { id: 'cave', label: LOCATION_DISPLAY.cave },
  { id: 'forbidden', label: LOCATION_DISPLAY.forbidden },
  { id: 'arctic_sea', label: LOCATION_DISPLAY.arctic_sea },
  { id: 'desert_lake', label: LOCATION_DISPLAY.desert_lake },
] as const;

export type CreatureKind =
  | 'standard'
  | 'isFrog'
  | 'isStarfish'
  | 'isCrab'
  | 'isOctopus'
  | 'isLobster'
  | 'isRay'
  | 'isWhiteShark'
  | 'isGoldenCarp'
  | 'isBottle'
  | 'isOyster'
  | 'isConch'
  | 'isFossil';

/** Samme dispatch som `CuteFishModel` → `StandardFishModel`. */
export function usesStandardFishMesh(config: {
  isStarfish?: boolean;
  isFrog?: boolean;
  isGoldenFrog?: boolean;
  isCrab?: boolean;
  isOctopus?: boolean;
  isLobster?: boolean;
  isRay?: boolean;
  isWhiteShark?: boolean;
  isGoldenCarp?: boolean;
  isBottle?: boolean;
  isOyster?: boolean;
  isConch?: boolean;
  isFossil?: boolean;
}): boolean {
  if (config.isStarfish) return false;
  if (config.isFrog && !config.isGoldenFrog) return false;
  if (config.isCrab) return false;
  if (config.isOctopus) return false;
  if (config.isLobster) return false;
  if (config.isRay) return false;
  if (config.isWhiteShark) return false;
  if (config.isGoldenCarp) return false;
  if (config.isBottle) return false;
  if (config.isOyster) return false;
  if (config.isConch) return false;
  if (config.isFossil) return false;
  return true;
}

export const STANDARD_FISH_PART_IDS = [
  'body',
  'leftEye',
  'rightEye',
  'tail',
  'dorsalFin',
  'sideFinsPair',
  'leftFin',
  'rightFin',
  'pelvicFins',
  'beak',
  'jaw',
  'lure',
  'whiskers',
  'sword',
  'dinoHead',
  'dinoLegs',
  'teeth',
  'mouth',
] as const;

/** Del-navne til PartGroup i LobsterModel — skal matche `CuteFishModel`. */
export const LOBSTER_PART_IDS = ['body', 'head', 'leftClaw', 'rightClaw', 'legs', 'eyes'] as const;

/** Del-navne til PartGroup i CrabModel. */
export const CRAB_PART_IDS = ['body', 'leftClaw', 'rightClaw', 'legs', 'eyes'] as const;

export const OCTOPUS_PART_IDS = ['head', 'tentacles', 'eyes'] as const;

export const FROG_PART_IDS = ['body', 'eyes', 'legs'] as const;

export const RAY_PART_IDS = ['body', 'leftWing', 'rightWing', 'tail', 'eyes'] as const;

export const STARFISH_PART_IDS = ['body', 'arms', 'eyes'] as const;

export function detectCreatureKind(config: {
  isFrog?: boolean;
  isStarfish?: boolean;
  isCrab?: boolean;
  isOctopus?: boolean;
  isLobster?: boolean;
  isRay?: boolean;
  isWhiteShark?: boolean;
  isGoldenCarp?: boolean;
  isBottle?: boolean;
  isOyster?: boolean;
  isConch?: boolean;
  isFossil?: boolean;
}): CreatureKind {
  if (config.isFrog) return 'isFrog';
  if (config.isStarfish) return 'isStarfish';
  if (config.isCrab) return 'isCrab';
  if (config.isOctopus) return 'isOctopus';
  if (config.isLobster) return 'isLobster';
  if (config.isRay) return 'isRay';
  if (config.isWhiteShark) return 'isWhiteShark';
  if (config.isGoldenCarp) return 'isGoldenCarp';
  if (config.isBottle) return 'isBottle';
  if (config.isOyster) return 'isOyster';
  if (config.isConch) return 'isConch';
  if (config.isFossil) return 'isFossil';
  return 'standard';
}

/** Per-del justering: del-liste for aktiv model, eller `null` hvis ikke understøttet. */
export function getEditorPartIdsForConfig(config: {
  isFrog?: boolean;
  isGoldenFrog?: boolean;
  isStarfish?: boolean;
  isCrab?: boolean;
  isOctopus?: boolean;
  isLobster?: boolean;
  isRay?: boolean;
  isWhiteShark?: boolean;
  isGoldenCarp?: boolean;
  isBottle?: boolean;
  isOyster?: boolean;
  isConch?: boolean;
  isFossil?: boolean;
}): readonly string[] | null {
  if (config.isFrog && config.isGoldenFrog) return STANDARD_FISH_PART_IDS;
  const kind = detectCreatureKind(config);
  switch (kind) {
    case 'standard':
      return STANDARD_FISH_PART_IDS;
    case 'isLobster':
      return LOBSTER_PART_IDS;
    case 'isCrab':
      return CRAB_PART_IDS;
    case 'isOctopus':
      return OCTOPUS_PART_IDS;
    case 'isFrog':
      return FROG_PART_IDS;
    case 'isRay':
      return RAY_PART_IDS;
    case 'isStarfish':
      return STARFISH_PART_IDS;
    default:
      return null;
  }
}

/**
 * Alle parameter-nøgler der kan låses i editoren.
 * Matches felterne i FishModelConfig + sub-felter for bodyShape.
 * Bruges af lås-systemet og tilfældig-generatoren.
 */
export const ALL_LOCKABLE_PARAM_KEYS: readonly string[] = [
  'bodyShape.0',
  'bodyShape.1',
  'bodyShape.2',
  'scale',
  'speed',
  'tail',
  'bodyProfile',
  'bodyShadingStyle',
  'bodyClearcoat',
  'bodyClearcoatRoughness',
  'bodySegments',
  'color',
  'colorGradient',
  'useRainbow',
  'chameleonMode',
  'bodyHemisphereTint',
  'bodyOpacity',
  'finOpacity',
  'emissive',
  'dorsalFinType',
  'dorsalFinEmbed',
  'sideFinScale',
  'sideFinPlacement',
  'showPelvicFins',
  'pelvicFinScale',
  'finColor',
  'tailScale',
  'tailSwingAmplitude',
  'tailFinMovement',
  'eyeConfig',
  'teeth',
  'mouthType',
  'bodyPattern',
  'patternColor',
  'patternDensity',
  'bioluminescent',
  'electricSparks',
  'electricBolts',
  'pufferInflation',
] as const;

/**
 * Fornuftige min/max-intervaller for tilfældig-generering.
 * Snævrere end editorens fulde range for at undgå monstrøse resultater.
 * Dækker kun parametre der giver visuelt rimelige fisk.
 */
export const RANDOMIZE_RANGES: Record<string, { min: number; max: number }> = {
  'bodyShape.0': { min: 0.5, max: 1.8 },
  'bodyShape.1': { min: 0.5, max: 1.8 },
  'bodyShape.2': { min: 0.7, max: 2.0 },
  scale: { min: 0.6, max: 1.6 },
  speed: { min: 0.5, max: 2.5 },
  tailScale: { min: 0.7, max: 1.5 },
  sideFinScale: { min: 0.7, max: 1.4 },
  pelvicFinScale: { min: 0.7, max: 1.3 },
  dorsalFinEmbed: { min: 0, max: 0.2 },
  bodyOpacity: { min: 0.3, max: 1.0 },
  finOpacity: { min: 0.4, max: 1.0 },
  tailSwingAmplitude: { min: 0.1, max: 0.6 },
  bodyClearcoat: { min: 0, max: 1 },
  bodyClearcoatRoughness: { min: 0, max: 0.5 },
  /** Lige tal 8–32 — randomize bruger `normalizeBodySegments`. */
  bodySegments: { min: 8, max: 32 },
  patternDensity: { min: 0.5, max: 2.5 },
};

/**
 * Arrays at vælge tilfældigt fra (selects/dropdowns).
 * Kun de mest "gyldige" værdier inkluderes.
 */
export const RANDOMIZE_SELECT_OPTIONS = {
  tail: EDITOR_HALEFORM_TAIL_TYPES,
  dorsalFinType: [undefined, ...DORSAL_FIN_TYPES] as (DorsalFinType | undefined)[],
  bodyProfile: BODY_PROFILE_OPTIONS,
  bodyPattern: [
    'solid',
    'stripes',
    'hstripes',
    'waves',
    'spots',
    'koi',
    'trout',
    'scales',
    'marble',
    'leopard',
    'neon',
    'bicolor',
    'ocellus',
  ] as const,
  mouthType: ['none', 'wide_shark', 'round_sucker', 'underbite', 'beak'] as const,
  tailFinMovement: ['normal', 'paddle'] as const,
} as const;

/** Tand-type options til randomize */
export const RANDOMIZE_TEETH_TYPES = ['shark_double', 'fangs', 'tiny', 'tusks'] as const;
