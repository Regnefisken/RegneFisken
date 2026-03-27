import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const extDir = path.join(__dirname, '_extracted');
const srcData = path.join(root, 'src', 'data');

function ex(name) {
  return fs.readFileSync(path.join(extDir, `${name}.txt`), 'utf8').trim();
}

function writeDataFile(name, content) {
  fs.writeFileSync(path.join(srcData, name), content, 'utf8');
  console.log('wrote', name);
}

let goalsRaw = ex('GOALS');
goalsRaw = goalsRaw.replace(
  /icon:\s*<span className="turtle-emoji">🐢<\/span>/,
  "icon: '🐢'"
);
goalsRaw = goalsRaw.replace(
  /condition: \(s\) => s\.areasVisited && s\.areasVisited\.length >= Object\.keys\(LOCATIONS\)\.length/,
  'condition: (s) => (s.areasVisited?.length ?? 0) >= Object.keys(LOCATIONS).length'
);
goalsRaw = goalsRaw.replace(
  /condition: \(s\) => s\.hasTurtleHatched/,
  'condition: (s) => !!s.hasTurtleHatched'
);

const fishBody = ex('CATCH_MASTER_DATA');

writeDataFile(
  'weather.ts',
  `import type { WeatherTypeId, WeatherTypesMap } from '../types/game.js';

export const WEATHER_TYPES = ${ex('WEATHER_TYPES')} as const satisfies Record<
  WeatherTypeId,
  WeatherTypesMap[WeatherTypeId]
>;
`
);

writeDataFile(
  'equipment.ts',
  `import type { BucketTier, RodTier } from '../types/shop.js';

export const BUCKET_TIERS: BucketTier[] = ${ex('BUCKET_TIERS')};

export const ROD_TIERS: RodTier[] = ${ex('ROD_TIERS')};

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
`
);

writeDataFile(
  'fish.ts',
  `import type { CatchMasterEntry, FishSpeciesBuckets, FishDatabaseRow } from '../types/fish.js';

export const FROG_COLOR_VARIANTS: number[] = ${ex('FROG_COLOR_VARIANTS')};

export const GOLDEN_FROG_COLOR = 0xffd700;

export const CATCH_MASTER_DATA: CatchMasterEntry[] = ${fishBody};

export const FISH_DATABASE: FishDatabaseRow[] = CATCH_MASTER_DATA.map((c) => ({
  id: c.id,
  name: c.name,
  rarity: c.rarity,
  primaryAreas: c.primaryAreas,
  requirements: c.requirements,
  itemType: c.itemType,
}));

export const FISH_SPECIES: FishSpeciesBuckets = {
  Almindelig: CATCH_MASTER_DATA.filter((c) => c.type === 'fish' && c.rarity === 'Almindelig').map((c) => c.name),
  Sjælden: CATCH_MASTER_DATA.filter((c) => c.type === 'fish' && c.rarity === 'Sjælden').map((c) => c.name),
  Legendarisk: CATCH_MASTER_DATA.filter((c) => c.type === 'fish' && c.rarity === 'Legendarisk').map((c) => c.name),
  Mystisk: CATCH_MASTER_DATA.filter((c) => c.rarity === 'Mystisk').map((c) => c.name),
  Forhistorisk: CATCH_MASTER_DATA.filter((c) => c.rarity === 'Forhistorisk').map((c) => c.name),
  Boss: CATCH_MASTER_DATA.filter((c) => c.rarity === 'Boss').map((c) => c.name),
  Quest: CATCH_MASTER_DATA.filter((c) => c.rarity === 'Quest').map((c) => c.name),
  Fare: CATCH_MASTER_DATA.filter((c) => c.rarity === 'Fare').map((c) => c.name),
};

export type CuteFishConfigMap = Record<string, NonNullable<CatchMasterEntry['model']>>;

export const CUTE_FISH_CONFIG: CuteFishConfigMap = CATCH_MASTER_DATA.reduce<CuteFishConfigMap>((acc, c) => {
  if (c.model) acc[c.id] = c.model;
  return acc;
}, {});
`
);

writeDataFile(
  'graphics.ts',
  `import type { GraphicsConfigMap } from '../types/game.js';

export const GRAPHICS_CONFIG = ${ex('GRAPHICS_CONFIG')} as const satisfies GraphicsConfigMap;
`
);

writeDataFile(
  'combat.ts',
  `import type { PoolRarityWeights, FightParamsMap, SpecialOnCatchMap } from '../types/game.js';

export const POOL_WEIGHTS = ${ex('POOL_WEIGHTS')} as const satisfies PoolRarityWeights;

export const FIGHT_PARAMS = ${ex('FIGHT_PARAMS')} as const satisfies FightParamsMap;

export const SPECIAL_ON_CATCH = ${ex('SPECIAL_ON_CATCH')} as const satisfies SpecialOnCatchMap;

export const TRUE_BOSS_IDS = new Set<string>([
  'kraken',
  'oyster',
  'fisk_gnavne_gorm',
  'fisk_plesiosaurus',
  'fisk_hvidhaj',
  'fisk_soeuhyre',
]);

export const TRUE_BOSS_ITEM_TYPES = new Set<string>([
  'kraken',
  'oyster',
  'gnavne_gorm',
  'plesiosaur',
  'boss_hvidhaj',
  'soeuhyre',
]);

export const STREAK_EXCEPTION_TYPES = new Set<string>(['jellyfish', 'piranha', 'kraken']);
`
);

writeDataFile(
  'locations.ts',
  `import type { LocationConfig } from '../types/game.js';
import type { LocationId } from '../types/locations.js';

export const LOCATION_DISPLAY = ${ex('LOCATION_DISPLAY')} as const;

export const FORBIDDEN_DESCRIPTION =
  'Farlig piratsø med legendariske skatte og mystiske væsener';

export const LOCATIONS = ${ex('LOCATIONS')} as const satisfies Record<LocationId, LocationConfig>;

export const AREAS: LocationConfig[] = Object.values(LOCATIONS);

export function getLocation(id: string): LocationConfig {
  return (LOCATIONS as Record<string, LocationConfig>)[id] ?? LOCATIONS.pier;
}
`
);

writeDataFile(
  'shop.ts',
  `import type { ShopItem } from '../types/shop.js';

export const SHOP_ITEMS: ShopItem[] = ${ex('SHOP_ITEMS')};
`
);

writeDataFile(
  'world.ts',
  `import type { DayNightCycle, ParrotJoke } from '../types/game.js';

export const DAY_NIGHT_CYCLE = ${ex('DAY_NIGHT_CYCLE')} as const satisfies DayNightCycle;

export const RAT_FACTS: string[] = ${ex('RAT_FACTS')};

export const PARROT_JOKES: ParrotJoke[] = ${ex('PARROT_JOKES')};

export const PIRATE_QUOTES: string[] = ${ex('PIRATE_QUOTES')};

export const BALLOON_HIDEOUTS = ${ex('BALLOON_HIDEOUTS')} as const;
`
);

writeDataFile(
  'collectibles.ts',
  `import type { CollectibleId, CollectiblesRegistry, CompanionDef } from '../types/collectibles.js';

export const COLLECTIBLES = ${ex('COLLECTIBLES')} as CollectiblesRegistry;

export const COMPANIONS_DATABASE: CompanionDef[] = ${ex('COMPANIONS_DATABASE')};

export function getNextMilestone(type: CollectibleId, delivered: number): number | null {
  const cfg = COLLECTIBLES[type];
  if (!cfg) return null;
  const milestones = Object.keys(cfg.milestoneRewards)
    .map(Number)
    .sort((a, b) => a - b);
  for (const m of milestones) {
    if (delivered < m) return m;
  }
  return null;
}
`
);

writeDataFile(
  'progression.ts',
  `import type { GoalDef } from '../types/progression.js';
import { LOCATIONS } from './locations.js';
import { SHOP_ITEMS } from './shop.js';

export const DESERT_SET = ${ex('DESERT_SET')} as const;

export const ARCTIC_SET = ${ex('ARCTIC_SET')} as const;

export const GOALS: GoalDef[] = ${goalsRaw};
`
);

writeDataFile(
  'version.ts',
  `export const APP_VERSION = '9.0';

export const SAVE_FORMAT_VERSION = 14;
`
);

writeDataFile(
  'xp.ts',
  `import type { XpBalancing, XpRewardsConfig } from '../types/game.js';

export const XP_REWARDS: XpRewardsConfig = {
  fish: { Almindelig: 10, Sjælden: 25, Legendarisk: 60 },
  item: { treasure: 80, junk: 2 },
};

/** Deaktiveret i legacy — beholdt for API-kompatibilitet. */
export function xpWeightBonus(_weight: number): number {
  void _weight;
  return 0;
}

export const XP_BALANCING = ${ex('XP_BALANCING')} as const satisfies XpBalancing;

export function xpNeededForLevel(lvl: number): number {
  const { baseXp, linearStep, exponentialFrom, exponentialRate } = XP_BALANCING;
  const linear = baseXp + (lvl - 1) * linearStep;
  if (lvl <= exponentialFrom) return linear;
  return Math.floor(linear * Math.pow(exponentialRate, lvl - exponentialFrom));
}
`
);

writeDataFile(
  'math-config.ts',
  `import type { FarvandeMap, RegnehistorieTemplate, LetteRegnehistorieTemplate, OpMultipliersMap } from '../types/math.js';

export const FARVANDE = ${ex('FARVANDE')} as const satisfies FarvandeMap;

export function getDifficultyMultiplier(difficulty: string): number {
  if (difficulty === 'expert') return 10;
  if (difficulty === 'intermediate') return 4;
  return 1;
}

export const REGNEHISTORIE_TEMPLATES: RegnehistorieTemplate[] = ${ex('REGNEHISTORIE_TEMPLATES')};

export const LETTE_REGNEHISTORIE_TEMPLATES: LetteRegnehistorieTemplate[] = ${ex(
    'LETTE_REGNEHISTORIE_TEMPLATES'
  )};

export const OP_MULTIPLIERS = ${ex('OP_MULTIPLIERS')} as const satisfies OpMultipliersMap;
`
);

const enrichmentBody = `
import { CATCH_MASTER_DATA } from './fish.js';
import {
  POOL_WEIGHTS,
  FIGHT_PARAMS,
  SPECIAL_ON_CATCH,
  TRUE_BOSS_IDS,
} from './combat.js';
import type { EnrichedCatchEntry } from '../types/fish.js';

export const BASE_DEFAULTS = ${ex('BASE_DEFAULTS')} as const;

export const ENRICHED_CATCH_DATA: EnrichedCatchEntry[] = CATCH_MASTER_DATA.map((c) => {
  const rarityKey = c.rarity as keyof typeof BASE_DEFAULTS;
  const defaults = BASE_DEFAULTS[rarityKey] ?? BASE_DEFAULTS['Almindelig'];
  const bwMin = c.weightRange ? c.weightRange[0] : defaults.baseWeightMin;
  const bwMax = c.weightRange ? c.weightRange[1] : defaults.baseWeightMax;
  const itemType = c.itemType as keyof typeof FIGHT_PARAMS;
  const fightParams =
    FIGHT_PARAMS[itemType] ?? { requiredAnswers: 1, baseTimeLimit: 0 };
  const special =
    SPECIAL_ON_CATCH[c.itemType as keyof typeof SPECIAL_ON_CATCH] ?? null;
  return {
    ...c,
    isTrueBoss: TRUE_BOSS_IDS.has(c.id),
    locations: [...c.primaryAreas],
    baseWeightMin: bwMin,
    baseWeightMax: bwMax,
    baseValue: c.value != null ? c.value : defaults.baseValue,
    baseXP: c.xpReward != null ? c.xpReward : defaults.baseXP,
    baseDR: defaults.baseDR,
    weightRange: [bwMin, bwMax] as [number, number],
    fightParams,
    specialOnCatch: special,
    lootWeight:
      c.lootWeight != null
        ? c.lootWeight
        : c.type === 'fish' || c.type === 'treasure'
          ? POOL_WEIGHTS[c.rarity as keyof typeof POOL_WEIGHTS] ?? 10
          : 0,
  };
});

export function matchesLocation(entry: { locations: string[] }, location: string): boolean {
  return entry.locations.includes(location) || entry.locations.includes('all');
}

export type ModifierCtx = {
  difficulty?: number;
  isBoss?: boolean;
  isPlesiosaur?: boolean;
  rodTimeBonus?: number;
  zenMode?: boolean;
  specialOnCatch?: string | null;
};

export const MODIFIER_PIPELINE = {
  applyLootModifiers<T extends Record<string, number>>(baseWeights: T, _unused: ModifierCtx): T {
    void _unused;
    return { ...baseWeights };
  },
  applyCombatModifiers(
    baseFP: { requiredAnswers: number; baseTimeLimit: number },
    ctx: ModifierCtx
  ) {
    const { requiredAnswers, baseTimeLimit } = baseFP;
    let timeLimit =
      baseTimeLimit > 0
        ? baseTimeLimit
        : ctx.difficulty === 3
          ? 12
          : ctx.difficulty === 2
            ? 10
            : 8;
    if (ctx.isBoss || ctx.isPlesiosaur) timeLimit = Math.max(timeLimit, 30);
    timeLimit += ctx.rodTimeBonus || 0;
    if (ctx.zenMode) timeLimit = Infinity;
    return { requiredAnswers, timeLimit };
  },
  applyRewardModifiers(
    baseReward: { value: number; xp: number },
    ctx: ModifierCtx
  ) {
    const { value, xp } = baseReward;
    const xpMultiplier = 1;
    return {
      value,
      xp,
      xpMultiplier,
      specialEvent: ctx.specialOnCatch || null,
    };
  },
};
`;

writeDataFile('enrichment.ts', enrichmentBody.trimStart());

console.log('done');
