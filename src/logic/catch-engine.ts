import type { CatchRequirements, EnrichedCatchEntry, RollCatchResult } from '../types/fish.js';
import { naturalCollectibleRateMultiplier } from '../data/collectible-catch-saturation.js';
import { ENRICHED_CATCH_DATA, matchesLocation, MODIFIER_PIPELINE } from '../data/enrichment.js';
import { getLocation } from '../data/locations.js';
import { rollFrogCatchColor } from '../three/models/cuteFishUtils.js';
import { getRarityWeights, pickColor, RARITY_KEY_TO_LABEL, rollRarityPipeline } from './rarity.js';

/** Sandsynlighed pr. kast for lokationssamleobjekter markeret med `collectibleTypes: ['crystal']` (kun grotten pt.). */
const LOCATION_CRYSTAL_ROLL_CHANCE = 0.025;

const DEFAULT_BOSS_ROLL_CHANCE = 0.1;
/** Østers-boss i Dybet: højere sandsynlighed for boss-trinnet mens Perlelim er aktivt (puljen er ofte kun østers). */
const PERLELIM_ABYSS_BOSS_ROLL_CHANCE = 0.22;

export function computeAdditiveDR(
  now: number,
  upgrades: string[],
  conchBaitExpiry: number,
  flyBaitExpiry: number,
  hajBloodExpiry: number,
  perleLimExpiry: number,
): number {
  let dr = 0;
  if (upgrades.includes('heldig_firkloever')) dr += 8;
  if (upgrades.includes('pirate_hat')) dr += 5;
  if (now < conchBaitExpiry) dr += 6;
  if (now < hajBloodExpiry) dr += 15;
  if (now < flyBaitExpiry) dr += 12;
  if (now < perleLimExpiry) dr += 15;
  return dr;
}

export function computeAdditiveVR(upgrades: string[]): number {
  return upgrades.includes('golden_hook') ? 15 : 0;
}

export function makeId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export interface CatchRollParams {
  difficulty: number;
  playerUpgrades?: string[];
  level?: number;
  hasMapLeft?: boolean;
  location?: string;
  isBossFight?: boolean;
  junkStreak?: number;
  helleflynderCaught?: number;
  questItems?: string[];
  activeConchBait?: boolean;
  activeFossilBait?: boolean;
  activeFlyBait?: boolean;
  activeBait?: string | null;
  hajBloodExpiry?: number;
  perleLimExpiry?: number;
  additiveDR?: number;
  additiveVR?: number;
  weatherType?: string;
  hvalbofActive?: boolean;
  krakenDefeated?: boolean;
  koedklumpActive?: boolean;
  soeuhyreDefeated?: boolean;
  /** Afleverede til NPC’er — styrer naturlig drop-reduktion pr. type efter threshold (bait immun). */
  collectibleDelivered?: Partial<Record<'fossil' | 'conch' | 'pearl' | 'sardine', number>> | null;
}

export function weightedFishPick(entries: EnrichedCatchEntry[]): EnrichedCatchEntry {
  const totalW = entries.reduce((s, e) => s + (e.lootWeight || 1), 0);
  let roll = Math.random() * totalW;
  for (const entry of entries) {
    roll -= entry.lootWeight || 1;
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1];
}

export function createJunkItem(location = 'pier'): RollCatchResult {
  const junkPool = ENRICHED_CATCH_DATA.filter(
    (e) => e.itemType === 'junk' && matchesLocation(e, location)
  );
  if (junkPool.length > 0) {
    const chosen = junkPool[Math.floor(Math.random() * junkPool.length)];
    const [minW, maxW] = chosen.weightRange || [1.0, 2.0];
    const weight = Number((minW + Math.random() * (maxW - minW)).toFixed(1));
    return {
      id: makeId(),
      fishModelId: chosen.id,
      species: chosen.name,
      weight,
      value: chosen.value ?? 0,
      rarity: 'Skrald',
      color: chosen.model?.color ?? 0x4a3728,
      itemType: 'junk',
      visual: chosen.visual,
      xpReward: chosen.xpReward ?? 2,
    };
  }
  return {
    id: makeId(),
    species: 'Gammel Støvle',
    weight: 1.5,
    value: 0,
    rarity: 'Skrald',
    color: 0x4a3728,
    itemType: 'junk',
    xpReward: 2,
  };
}

/**
 * Ur-Krystal m.m.: data-drevet via `locations.collectibleTypes` + `itemType: 'crystal_junk'`.
 * Kører før skrald-trinnet så jackpot ikke sluges af 12 % junk.
 */
function tryRollLocationCrystal(
  location: string,
  loc: ReturnType<typeof getLocation>,
  playerUpgrades: string[],
  isBossFight: boolean,
  additiveVR: number
): RollCatchResult | null {
  if (isBossFight || !loc.collectibleTypes.includes('crystal')) return null;
  if (Math.random() >= LOCATION_CRYSTAL_ROLL_CHANCE) return null;
  const crystalPool = ENRICHED_CATCH_DATA.filter((e) => {
    if (e.itemType !== 'crystal_junk') return false;
    if (!matchesLocation(e, location)) return false;
    const req = e.requirements || {};
    if (req.requiredRod && !playerUpgrades.includes(req.requiredRod)) return false;
    if (req.requiredUpgrade && !playerUpgrades.includes(req.requiredUpgrade)) return false;
    return true;
  });
  if (crystalPool.length === 0) return null;
  const chosen = weightedFishPick(crystalPool);
  const [minW, maxW] = chosen.weightRange;
  const weight = Number((minW + Math.random() * (maxW - minW)).toFixed(2));
  return {
    id: makeId(),
    fishModelId: chosen.id,
    species: chosen.name,
    weight,
    value: (chosen.baseValue ?? 0) + additiveVR,
    rarity: chosen.rarity,
    color: 0x00ffff,
    itemType: 'crystal_junk',
    visual: chosen.visual,
    xpReward: chosen.baseXP,
  };
}

export function getRequirementText(fish: { requirements?: CatchRequirements | null }): string {
  const req = fish.requirements;
  if (!req) return 'Ingen specielle krav';
  const text: string[] = [];
  if (req.requiredRod === 'rod_mahogni') text.push('Mahogni-stang');
  if (req.requiredBait === 'bait') text.push('Mystisk Madding 🎣 (1 perle til havfruen)');
  if (req.requiredBait === 'koedklump') text.push('Klistret Kødklump 🍖 (5 konkylier til pingvinen)');
  if (req.requiredBait === 'hvalbof') text.push('Kæmpe Hvalbøf 🥩 (1 fossil til piraten)');
  if (req.requiredUpgrade === 'biolum_floats') text.push('Selvlysende Prop');
  if (req.requiredUpgrade === 'golden_hook') text.push('Guld Krog');
  return text.length ? `Kræver: ${text.join(' + ')}` : 'Ingen specielle krav';
}

/**
 * Kropfarve til `RollCatchResult.color` / 3D — skal matche admin tvangs-fangst (`buildForcedCatch`).
 * Sjældne varianter: rød hummer, gylden krabbe (`resolveBodyColor` læser `fish.color` for disse).
 */
export function rollCatchDisplayColor(
  fishId: string,
  modelColor: number | null | undefined,
  rarity: string,
): number {
  if (fishId === 'fisk_frø') {
    return rollFrogCatchColor();
  }
  let c = modelColor ?? pickColor(rarity);
  if (fishId === 'fisk_hummer' && Math.random() < 0.25) {
    c = 0xee3333;
  } else if (fishId === 'fisk_krabbe' && Math.random() < 0.25) {
    c = 0xe0b070;
  }
  return c;
}

/**
 * Hoved-fangstkast — ren logik, ingen globale flags (boss-bait flags sendes som parametre).
 */
export function rollForCatch(params: CatchRollParams): RollCatchResult {
  const {
    playerUpgrades = [],
    level = 1,
    hasMapLeft = false,
    location = 'pier',
    isBossFight = false,
    junkStreak = 0,
    questItems = [],
    activeConchBait = false,
    activeFossilBait = false,
    activeFlyBait = false,
    activeBait = null,
    hajBloodExpiry = 0,
    perleLimExpiry = 0,
    additiveDR = 0,
    additiveVR = 0,
    weatherType = 'clear',
    hvalbofActive = false,
    krakenDefeated = false,
    koedklumpActive = false,
    soeuhyreDefeated = false,
    collectibleDelivered = null,
  } = params;

  const cd = {
    fossil: collectibleDelivered?.fossil ?? 0,
    conch: collectibleDelivered?.conch ?? 0,
    pearl: collectibleDelivered?.pearl ?? 0,
    sardine: collectibleDelivered?.sardine ?? 0,
  };

  const loc = getLocation(location);
  const now = Date.now();

  if (!isBossFight) {
    if (activeConchBait && Math.random() < 0.3) {
      return {
        id: makeId(),
        species: 'Konkylie',
        weight: 0.3,
        value: 0,
        rarity: 'Quest',
        color: 0xf4a460,
        itemType: 'conch',
      };
    }
    if (activeFossilBait && Math.random() < 0.25) {
      return {
        id: makeId(),
        species: 'Mystisk Fossil',
        weight: 3.0,
        value: 0,
        rarity: 'Mystisk',
        color: 0x8b7355,
        itemType: 'fossil',
      };
    }
  }

  if (!hasMapLeft && Math.random() < 0.05) {
    return {
      id: makeId(),
      species: 'Flaskepost',
      weight: 0.5,
      value: 0,
      rarity: 'Quest',
      color: 0x88ccaa,
      itemType: 'bottle',
    };
  }

  const fossilLocationBonus = loc.specialRules.fossilBonus ?? -1;
  if (fossilLocationBonus >= 0 && !isBossFight && junkStreak < 3) {
    const fossilChance = 0.015 + Math.max(0, level - 5) * 0.002 + fossilLocationBonus;
    const fossilMult = naturalCollectibleRateMultiplier(cd.fossil);
    if (Math.random() < Math.min(fossilChance, 0.08) * fossilMult) {
      return {
        id: makeId(),
        species: 'Mystisk Fossil',
        weight: 3.0,
        value: 0,
        rarity: 'Mystisk',
        color: 0x8b7355,
        itemType: 'fossil',
      };
    }
  }

  /** Sardine: ikke under samme junk-streak-spærring som fossil (ellers 0% i mange sessioner). */
  const sardineBonus = loc.specialRules.sardineBonus;
  if (sardineBonus && sardineBonus > 0 && !isBossFight) {
    const sardMult = naturalCollectibleRateMultiplier(cd.sardine);
    if (Math.random() < sardineBonus * sardMult) {
      const sardineEntry = ENRICHED_CATCH_DATA.find((e) => e.id === 'sardine');
      if (sardineEntry && matchesLocation(sardineEntry, location)) {
        const [minW, maxW] = sardineEntry.weightRange;
        const weight = Number((minW + Math.random() * (maxW - minW)).toFixed(2));
        return {
          id: makeId(),
          fishModelId: 'sardine',
          species: sardineEntry.name,
          weight,
          value: sardineEntry.baseValue ?? 0,
          rarity: String(sardineEntry.rarity),
          color: sardineEntry.model?.color ?? 0x7a9ab5,
          itemType: 'sardine',
          visual: 'sardine',
        };
      }
    }
  }

  if (loc.specialRules.plesioChance && !isBossFight) {
    if (Math.random() < loc.specialRules.plesioChance && activeBait === 'bait') {
      return {
        id: makeId(),
        fishModelId: 'fisk_plesiosaurus',
        species: 'Plesiosaurus',
        weight: 450,
        value: 0,
        rarity: 'Forhistorisk',
        color: 0x2d6a4f,
        itemType: 'plesiosaur',
      };
    }
  }

  const conchMult = activeConchBait ? 1 : naturalCollectibleRateMultiplier(cd.conch);
  if (!isBossFight && Math.random() < 0.02 * conchMult) {
    return {
      id: makeId(),
      species: 'Konkylie',
      weight: 0.3,
      value: 0,
      rarity: 'Quest',
      color: 0xf4a460,
      itemType: 'conch',
    };
  }

  if (!isBossFight && Math.random() < 0.02) {
    const bmEntry = ENRICHED_CATCH_DATA.find((e) => e.id === 'brandmand');
    if (bmEntry && matchesLocation(bmEntry, location)) {
      return {
        id: makeId(),
        species: 'Brandmand',
        weight: 0.1,
        value: 0,
        rarity: 'Fare',
        color: 0xff4500,
        itemType: 'jellyfish',
      };
    }
  }

  const crystalRoll = tryRollLocationCrystal(location, loc, playerUpgrades, isBossFight, additiveVR);
  if (crystalRoll) return crystalRoll;

  if (!isBossFight && Math.random() < 0.12) {
    return createJunkItem(location);
  }

  const activeHajBlood = now < hajBloodExpiry;
  const activePerleLim = now < perleLimExpiry;
  const baseBossChance =
    activePerleLim && location === 'abyss' ? PERLELIM_ABYSS_BOSS_ROLL_CHANCE : DEFAULT_BOSS_ROLL_CHANCE;

  const possibleBosses: {
    species: string;
    itemType: string;
    rarity: string;
    /** Vægt i boss-lotteri (østers skaleres efter perle-afleveringer; perlelim = immun). */
    w: number;
  }[] = [];

  const ke = ENRICHED_CATCH_DATA.find((e) => e.id === 'kraken');
  if (ke && matchesLocation(ke, location) && hvalbofActive && !krakenDefeated) {
    possibleBosses.push({ species: 'Kraken', itemType: 'kraken', rarity: 'Legendarisk', w: 1 });
  }

  if (!isBossFight) {
    const oe = ENRICHED_CATCH_DATA.find((e) => e.id === 'oyster');
    if (oe && matchesLocation(oe, location)) {
      const oysterCount = activePerleLim ? 7 : 1;
      const oysterW = activePerleLim ? 1 : naturalCollectibleRateMultiplier(cd.pearl);
      for (let i = 0; i < oysterCount; i++) {
        possibleBosses.push({ species: 'Østers med Perle', itemType: 'oyster', rarity: 'Boss', w: oysterW });
      }
    }
  }

  if (!isBossFight) {
    const he = ENRICHED_CATCH_DATA.find((e) => e.id === 'fisk_hvidhaj');
    if (he && matchesLocation(he, location)) {
      const sharkCount = activeHajBlood ? 6 : 1;
      for (let i = 0; i < sharkCount; i++) {
        possibleBosses.push({ species: 'Hvidhaj', itemType: 'boss_hvidhaj', rarity: 'Boss', w: 1 });
      }
    }
  }

  if (!isBossFight && !soeuhyreDefeated && koedklumpActive) {
    const se = ENRICHED_CATCH_DATA.find((e) => e.id === 'fisk_soeuhyre');
    if (se && matchesLocation(se, location)) {
      possibleBosses.push({ species: 'Søuhyre', itemType: 'soeuhyre', rarity: 'Legendarisk', w: 1 });
    }
  }

  if (possibleBosses.length > 0 && Math.random() < baseBossChance) {
    const tw = possibleBosses.reduce((s, b) => s + b.w, 0);
    let rw = Math.random() * tw;
    let boss = possibleBosses[0]!;
    for (const b of possibleBosses) {
      rw -= b.w;
      if (rw <= 0) {
        boss = b;
        break;
      }
    }
    const bossWeight =
      boss.itemType === 'boss_hvidhaj'
        ? 800 + Math.floor(Math.random() * 1468)
        : boss.itemType === 'soeuhyre'
          ? 1200 + Math.floor(Math.random() * 1600)
          : 800;
    const bossColor =
      boss.itemType === 'kraken'
        ? 0x6b006b
        : boss.itemType === 'oyster'
          ? 0xeeeed1
          : boss.itemType === 'boss_hvidhaj'
            ? 0x5a636b
            : boss.itemType === 'soeuhyre'
              ? 0x11aa33
              : 0xffd700;
    return {
      id: makeId(),
      fishModelId:
        boss.itemType === 'boss_hvidhaj'
          ? 'fisk_hvidhaj'
          : boss.itemType === 'soeuhyre'
            ? 'fisk_soeuhyre'
            : boss.itemType === 'oyster'
              ? 'oyster'
              : boss.itemType === 'kraken'
                ? 'kraken'
                : undefined,
      species: boss.species,
      weight: bossWeight,
      value: 0,
      rarity: boss.rarity,
      color: bossColor,
      itemType: boss.itemType,
    };
  }

  if (activeBait === 'legendary_bait' && !isBossFight) {
    const legendaryHere = ENRICHED_CATCH_DATA.filter(
      (e) =>
        e.type === 'fish' && e.rarity === 'Legendarisk' && matchesLocation(e, location)
    );
    if (legendaryHere.length > 0) {
      const chosen = legendaryHere[Math.floor(Math.random() * legendaryHere.length)];
      const [minW, maxW] = chosen.weightRange;
      const weight = Number((minW + Math.random() * (maxW - minW)).toFixed(1));
      const value = (chosen.baseValue || 80) + additiveVR;
      return {
        id: makeId(),
        fishModelId: chosen.id,
        species: chosen.name,
        weight,
        value,
        rarity: 'Legendarisk',
        color: 0xffd700,
        itemType: chosen.itemType || 'fish',
      };
    }
  }

  const baseWeights = getRarityWeights(level, additiveDR);
  const modW = MODIFIER_PIPELINE.applyLootModifiers(baseWeights, {
    level,
    activeBait,
    activeConchBait,
    activeFossilBait,
    weatherType,
    location,
    questItems,
  });

  const rarityKey = rollRarityPipeline(modW);
  const rarity = (RARITY_KEY_TO_LABEL[rarityKey] as string) ?? 'Almindelig';

  const candidates = ENRICHED_CATCH_DATA.filter((e) => {
    if (e.type !== 'fish' && e.type !== 'treasure') return false;
    if (e.rarity !== rarity) return false;
    if (!matchesLocation(e, location)) return false;
    const req = e.requirements || {};
    if (req.requiredRod && !playerUpgrades.includes(req.requiredRod)) return false;
    if (req.requiredUpgrade && !playerUpgrades.includes(req.requiredUpgrade)) return false;
    if (req.requiredBait && req.requiredBait !== activeBait) return false;
    return true;
  });

  let pool =
    candidates.length > 0
      ? candidates
      : ENRICHED_CATCH_DATA.filter((e) => {
          if (e.type !== 'fish' && e.type !== 'treasure') return false;
          if (e.rarity !== 'Almindelig') return false;
          if (!matchesLocation(e, location)) return false;
          const req = e.requirements || {};
          if (req.requiredRod && !playerUpgrades.includes(req.requiredRod)) return false;
          if (req.requiredUpgrade && !playerUpgrades.includes(req.requiredUpgrade)) return false;
          return true;
        });

  if (pool.length === 0) {
    return {
      id: makeId(),
      species: 'Tom Krog',
      weight: 0,
      value: 0,
      rarity: 'Skuffelse',
      color: 0x111111,
      itemType: 'nothing',
    };
  }

  if (activeFlyBait) {
    pool = pool.map((e) => {
      if (e.id === 'fisk_frø') return { ...e, lootWeight: (e.lootWeight || 1) * 3.0 };
      if (e.id === 'fisk_gylden_frø') return { ...e, lootWeight: (e.lootWeight || 1) * 4.0 };
      return e;
    });
  }

  const chosen = weightedFishPick(pool);
  const [minW, maxW] = chosen.weightRange;
  const weight = Number((minW + Math.random() * (maxW - minW)).toFixed(1));

  if (chosen.type === 'treasure') {
    const value = (chosen.baseValue || 0) + additiveVR;
    return {
      id: makeId(),
      fishModelId: chosen.id,
      species: chosen.name,
      weight,
      value,
      rarity,
      color: 0xd4af37,
      itemType: 'treasure',
      visual: chosen.visual,
      visualScale: chosen.visualScale,
    };
  }

  const value = (chosen.baseValue || 0) + additiveVR;
  const finalColor = rollCatchDisplayColor(chosen.id, chosen.model?.color, rarity);

  return {
    id: makeId(),
    fishModelId: chosen.id,
    species: chosen.name,
    weight,
    value,
    rarity,
    color: finalColor,
    itemType: chosen.itemType || 'fish',
  };
}
