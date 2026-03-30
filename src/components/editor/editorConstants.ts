import type { CatchItemType, CatchRarity, DorsalFinType, TailType } from '../../types/fish.js';

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
  'paddle',
  'ribbon',
  'heart',
  'sail',
  'kraken',
];

export const DORSAL_FIN_TYPES: DorsalFinType[] = [
  'standard',
  'shark',
  'spiked',
  'double',
  'mohawk',
  'crown',
  'tentacles',
];

/** Danske visningsnavne til hale-dropdown (værdi forbliver TailType). */
export const TAIL_TYPE_LABEL_DA: Record<TailType, string> = {
  standard: 'Standard',
  forked: 'Gaffelhale',
  flat: 'Flad',
  eel: 'Ål',
  thin: 'Tynd',
  chunky: 'Kraftig',
  star: 'Stjerne',
  none: 'Ingen',
  shark: 'Haj',
  dino: 'Dino',
  whip: 'Pisk',
  veil: 'Slør',
  lyre: 'Lyre',
  scalloped: 'Bølget kant',
  paddle: 'Pagaj',
  ribbon: 'Bånd',
  heart: 'Hjerte',
  sail: 'Sejl',
  kraken: 'Kraken',
};

/** Danske visningsnavne til rygfinne-type (værdi forbliver DorsalFinType). */
export const DORSAL_FIN_LABEL_DA: Record<DorsalFinType, string> = {
  standard: 'Standard (trekant)',
  shark: 'Haj',
  spiked: 'Pigget',
  double: 'Dobbel',
  mohawk: 'Mohawk',
  crown: 'Krone',
  tentacles: 'Tentakler',
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

export const PRIMARY_AREA_OPTIONS = [
  { id: 'pier', label: 'Molen (pier)' },
  { id: 'smaragd', label: 'Smaragd' },
  { id: 'tropical_island', label: 'Tropisk ø' },
  { id: 'abyss', label: 'Afgrunden' },
  { id: 'cave', label: 'Hule' },
  { id: 'forbidden', label: 'Forbudt' },
  { id: 'arctic_sea', label: 'Arktisk hav' },
  { id: 'desert_lake', label: 'Ørken-sø' },
] as const;

export const CREATURE_FLAG_KEYS = [
  'isFrog',
  'isStarfish',
  'isCrab',
  'isOctopus',
  'isLobster',
  'isRay',
  'isWhiteShark',
  'isGoldenCarp',
  'isBottle',
  'isOyster',
  'isConch',
  'isFossil',
  'isGoldenFrog',
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

export const CREATURE_RADIO_OPTIONS: { id: CreatureKind; label: string }[] = [
  { id: 'standard', label: 'Standard fisk' },
  { id: 'isFrog', label: 'Frø' },
  { id: 'isStarfish', label: 'Søstjerne' },
  { id: 'isCrab', label: 'Krabbe' },
  { id: 'isOctopus', label: 'Blæksprutte' },
  { id: 'isLobster', label: 'Hummer' },
  { id: 'isRay', label: 'Rokke' },
  { id: 'isWhiteShark', label: 'Hvidhaj' },
  { id: 'isGoldenCarp', label: 'Guldkarpe' },
  { id: 'isBottle', label: 'Flaske' },
  { id: 'isOyster', label: 'Østers' },
  { id: 'isConch', label: 'Konkylie' },
  { id: 'isFossil', label: 'Fossil' },
];

export function clearCreatureFlags(): Record<string, false> {
  return Object.fromEntries(CREATURE_FLAG_KEYS.map((k) => [k, false])) as Record<string, false>;
}

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
