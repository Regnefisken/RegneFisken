/**
 * Balance-simulator: virtuelle spillere, der fisker, sælger, køber og rejser efter spillets egne regler.
 *
 * Bruger spillets rigtige funktioner, hvor det er muligt:
 * - `rollForCatch` (hvad man fanger), `getEnrichedCatchEntryForRoll` og `fightTimeLimitSec` (antal svar
 *   og tidsgrænse pr. regnestykke, inkl. stangens tidsbonus)
 * - `xpForCatch`, `applyXP`, `calculateStreakBonus`, `getFinalStreakBonus` (XP og streak-bonus)
 * - `getBucketTier`, `inventoryBucketCount` (spandens størrelse)
 * - `SHOP_ITEMS` (priser og krav), `getUnlockedAreas`, `destinationAllowsTravel` (oplåsning og rejse)
 * - `computeAdditiveDR`, `computeAdditiveVR` (udstyrets effekt på sjældenhed og værdi)
 *
 * Kopieret, fordi det ligger inde i React-komponenter (hold det i takt med spillet):
 * - Hvornår man må kaste (`FishingControls.tsx`: fisketilladelser, Bambus i Dybet, Mahogni, intet vand).
 * - Ventetid til bid (`BITE_WAIT_MS_*`), salg af spanden (`HUD.tsx` → `sellAllFish`) og hvad der lægges
 *   i spanden efter en fangst (`MathChallenge.tsx`).
 *
 * Ikke simuleret: mål-belønninger, bosskampenes særlige belønninger, madding, vejr (altid klart),
 * kister åbnet for garderobe-ting, hytten, Jungleøen, NPC'er og minispil.
 */
import { getBucketTier } from '../../src/data/equipment.js';
import { getEnrichedCatchEntryForRoll } from '../../src/data/enrichment.js';
import { getLocation } from '../../src/data/locations.js';
import { SHOP_ITEMS } from '../../src/data/shop.js';
import { inventoryBucketCount } from '../../src/logic/bucket-inventory.js';
import { computeAdditiveDR, computeAdditiveVR, rollForCatch } from '../../src/logic/catch-engine.js';
import { fightTimeLimitSec } from '../../src/logic/fight-time.js';
import { destinationAllowsTravel, getUnlockedAreas } from '../../src/logic/travel-unlock.js';
import { applyXP, calculateStreakBonus, getFinalStreakBonus, xpForCatch } from '../../src/logic/xp-engine.js';
import { STREAK_EXCEPTION_TYPES } from '../../src/data/combat.js';
import type { RollCatchResult } from '../../src/types/fish.js';

// ─── Elevtyper og tidsforbrug ────────────────────────────────────────────────

export interface StudentProfile {
  id: string;
  name: string;
  /** Sandsynlighed for at et svar er rigtigt. */
  correctRate: number;
  /** Gennemsnitlig tid i sekunder til at svare på ét regnestykke. */
  secondsPerAnswer: number;
}

export const DEFAULT_PROFILES: StudentProfile[] = [
  { id: 'svag', name: 'Usikker regner', correctRate: 0.6, secondsPerAnswer: 14 },
  { id: 'middel', name: 'Middel regner', correctRate: 0.8, secondsPerAnswer: 9 },
  { id: 'staerk', name: 'Stærk regner', correctRate: 0.95, secondsPerAnswer: 5 },
];

/** Faste tider i sekunder for handlinger uden for regnestykket. Skøn; kan justeres. */
export const TIMING = {
  /** Kast-animation (FishingControls: 650 ms). */
  castSec: 0.65,
  /** Ventetid til bid (FishingControls: BITE_WAIT_MS_MIN / _SPAN / REEL_UPGRADE_BITE_SPAN_SHAVE_MS). */
  biteMinSec: 2.2,
  biteSpanSec: 3.8,
  reelShaveSec: 1.0,
  /** Fra "BID!" vises til spilleren trykker. */
  reactSec: 1.0,
  /** Læse fangst-panelet og trykke "Læg i Spanden" / "Videre". */
  resultPanelSec: 3.0,
  /** Tabt fisk: læse beskeden og lukke den. */
  lostPanelSec: 2.0,
  /** Åbne spanden og sælge. */
  sellSec: 4.0,
  /** Åbne butikken og købe én ting. */
  buySec: 6.0,
  /** Rejse til et andet område. */
  travelSec: 8.0,
  /** Straf for forkert svar (MathChallenge: timeLeft - 3). */
  wrongPenaltySec: 3,
};

// ─── Tilfældighed med frø, så kørsler kan gentages ─────────────────────────

/** Mulberry32: lille, hurtig PRNG med frø. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Kører `fn` med `Math.random` erstattet af en PRNG med frø (spillets funktioner bruger Math.random). */
export function withSeed<T>(seed: number, fn: () => T): T {
  const original = Math.random;
  Math.random = makeRng(seed);
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

// ─── Spillerstrategi: hvad en fornuftig spiller køber, i rækkefølge ──────────

/**
 * Indkøbsliste. Spilleren sparer op til den første ting på listen, som er tilladt (level og forudgående
 * køb), og køber ikke noget længere nede, før den er købt. Madding, ost, fjer og møbler købes ikke.
 */
export const DEFAULT_BUY_ORDER: string[] = [
  'bucket_iron',
  'travel_pass',
  'license_smaragd',
  'reel_upgrade',
  'rod_havblaa',
  'desert_sunglasses',
  'desert_waterbottle',
  'desert_sunhat',
  'desert_sunscreen',
  'arctic_beanie',
  'arctic_gloves',
  'arctic_hotwater',
  'arctic_scarf',
  'bucket_copper',
  'magnet',
  'heldig_firkloever',
  'rod_bambus',
  'rowboat',
  'license_abyss',
  'rod_mahogni',
  'headlamp',
  'bucket_silver',
  'map_right',
  'biolum_floats',
  'bucket_gold',
  'golden_hook',
  'luxury_boat',
];

const SHOP_BY_ID = new Map(SHOP_ITEMS.map((i) => [i.id, i]));

function isEligible(itemId: string, level: number, upgrades: string[]): boolean {
  const item = SHOP_BY_ID.get(itemId);
  if (!item) return false;
  if (level < item.requiredLevel) return false;
  const req = (item as { requiresUpgrade?: string }).requiresUpgrade;
  if (req && !upgrades.includes(req)) return false;
  return true;
}

// ─── Hvor man må fiske ───────────────────────────────────────────────────────

/** Spejler kast-reglerne i FishingControls.tsx (`castLine`). */
export function canFishAt(locationId: string, upgrades: string[]): boolean {
  const sr = getLocation(locationId).specialRules ?? {};
  if (locationId === 'smaragd' && !upgrades.includes('license_smaragd')) return false;
  if (locationId === 'abyss' && !upgrades.includes('license_abyss')) return false;
  if (locationId === 'abyss' && !upgrades.includes('rod_bambus')) return false;
  if ((sr as { noFishing?: boolean }).noFishing) return false;
  if ((sr as { requiresHeadlamp?: boolean }).requiresHeadlamp && !upgrades.includes('headlamp')) return false;
  if ((sr as { requiresMahogni?: boolean }).requiresMahogni && !upgrades.includes('rod_mahogni')) return false;
  return true;
}

/** Steder spilleren både har låst op, må rejse til og kan fiske på. */
export function fishableLocations(level: number, upgrades: string[], questItems: string[]): string[] {
  return getUnlockedAreas(level, upgrades, questItems)
    .map((a) => a.id)
    .filter((id) => id === 'pier' || destinationAllowsTravel(id, upgrades).ok)
    .filter((id) => canFishAt(id, upgrades));
}

// ─── Kategorier til rapporten ────────────────────────────────────────────────

export type CatchCategory =
  | 'fisk'
  | 'kiste_lille'
  | 'kiste'
  | 'kiste_stor'
  | 'skrald'
  | 'flaskepost'
  | 'boss'
  | 'krystal'
  | 'samleobjekt'
  | 'brandmand'
  | 'tom_krog'
  | 'andet';

export function categorize(c: RollCatchResult): CatchCategory {
  if (c.itemType === 'treasure') {
    if (c.fishModelId === 'sunket_kiste_lille') return 'kiste_lille';
    if (c.fishModelId === 'sunket_kiste_stor') return 'kiste_stor';
    return 'kiste';
  }
  if (c.itemType === 'fish' || c.itemType === 'piranha' || c.itemType === 'halibut' || c.itemType === 'axolotl' || c.itemType === 'golden_frog') return 'fisk';
  if (c.itemType === 'junk') return 'skrald';
  if (c.itemType === 'bottle') return 'flaskepost';
  if (['kraken', 'oyster', 'boss_hvidhaj', 'soeuhyre', 'gnavne_gorm', 'plesiosaur'].includes(c.itemType)) return 'boss';
  if (c.itemType === 'crystal_junk') return 'krystal';
  if (['fossil', 'conch', 'sardine', 'pearl'].includes(c.itemType)) return 'samleobjekt';
  if (c.itemType === 'jellyfish') return 'brandmand';
  if (c.itemType === 'nothing') return 'tom_krog';
  return 'andet';
}

// ─── Én spiller ──────────────────────────────────────────────────────────────

interface PlayerState {
  level: number;
  xp: number;
  coins: number;
  upgrades: string[];
  questItems: string[];
  inventory: RollCatchResult[];
  streak: number;
  junkStreak: number;
  location: string;
}

function rollParams(s: PlayerState) {
  const now = Date.now();
  return {
    difficulty: Math.min(3, Math.max(1, Math.floor(s.level / 4) || 1)),
    level: s.level,
    location: s.location,
    playerUpgrades: s.upgrades,
    questItems: s.questItems,
    activeBait: null,
    weatherType: 'clear',
    hasMapLeft: s.questItems.includes('map_left'),
    additiveDR: computeAdditiveDR(now, s.upgrades, 0, 0, 0, 0),
    additiveVR: computeAdditiveVR(s.upgrades),
    junkStreak: s.junkStreak,
  };
}

/** Typer, der lægges i spanden efter en vundet kamp (MathChallenge: addToInventory + samleobjekter). */
const INVENTORY_TYPES = new Set([
  'fish', 'treasure', 'junk', 'golden_frog', 'axolotl', 'halibut', 'pearl', 'piranha', 'fossil', 'conch', 'sardine',
]);
/** Typer, der skal være plads til i spanden (MathChallenge: "Spanden er fuld!"). */
const NEEDS_BUCKET_SPACE = new Set(['fish', 'junk', 'treasure', 'piranha']);
/** Beholdes ved salg (HUD: sellAllFish). */
const KEEP_ON_SELL = new Set(['plesiosaur', 'fossil', 'conch', 'sardine', 'crystal_junk']);
/** Belønning først ved klik på panelet; ikke simuleret (MathChallenge: deferPanelRewards). */
const DEFERRED_REWARD = new Set(['soeuhyre', 'gnavne_gorm', 'kraken', 'crystal_junk', 'pearl', 'boss_hvidhaj']);

export interface CatchRecord {
  location: string;
  category: CatchCategory;
  won: boolean;
  value: number;
}

export interface SimResult {
  profileId: string;
  minutes: number;
  /** Første tidspunkt (minutter) for hver milepæl, fx "level_5", "omraade_smaragd", "koeb_rod_bambus". */
  milestones: Record<string, number>;
  /** Mønter tjent (salg) pr. hele spilleminut, akkumuleret. */
  earnedByMinute: number[];
  /** Level ved udgangen af hvert spilleminut. */
  levelByMinute: number[];
  /** Fangster (forsøg) med kategori, sted og udfald. */
  catches: CatchRecord[];
  /** Sekunder brugt pr. sted. */
  secondsByLocation: Record<string, number>;
  final: { level: number; coins: number; earned: number; upgrades: string[] };
}

export interface SimOptions {
  profile: StudentProfile;
  minutes: number;
  seed: number;
  buyOrder?: string[];
  /** Antal prøvekast pr. sted, når spilleren vælger det bedste sted. */
  locationSampleSize?: number;
}

/** Forventet salgsværdi pr. kast på et sted, målt med prøvekast (uden at røre spillerens tilstand). */
function expectedValuePerCast(s: PlayerState, locationId: string, samples: number): number {
  const probe: PlayerState = { ...s, location: locationId };
  let total = 0;
  for (let i = 0; i < samples; i++) {
    const c = rollForCatch(rollParams(probe));
    if (INVENTORY_TYPES.has(c.itemType) && !KEEP_ON_SELL.has(c.itemType)) total += Number(c.value) || 0;
  }
  return total / samples;
}

export function simulatePlayer(opts: SimOptions): SimResult {
  const { profile, minutes, seed } = opts;
  const buyOrder = opts.buyOrder ?? DEFAULT_BUY_ORDER;
  const sampleSize = opts.locationSampleSize ?? 300;

  return withSeed(seed, () => {
    const rand = Math.random;
    const s: PlayerState = {
      level: 1, xp: 0, coins: 0, upgrades: [], questItems: [], inventory: [], streak: 0, junkStreak: 0, location: 'pier',
    };
    const endSec = minutes * 60;
    let t = 0;
    let earned = 0;
    const milestones: Record<string, number> = {};
    const earnedByMinute: number[] = [];
    const levelByMinute: number[] = [];
    const catches: CatchRecord[] = [];
    const secondsByLocation: Record<string, number> = {};
    const knownAreas = new Set<string>(['pier']);
    let needLocationChoice = true;

    const mark = (key: string) => {
      if (milestones[key] === undefined) milestones[key] = t / 60;
    };
    const advance = (sec: number) => {
      const before = t;
      t += sec;
      secondsByLocation[s.location] = (secondsByLocation[s.location] ?? 0) + sec;
      for (let m = Math.floor(before / 60); m < Math.floor(t / 60) && m < minutes; m++) {
        earnedByMinute[m] = earned;
        levelByMinute[m] = s.level;
      }
    };

    const checkAreas = () => {
      for (const id of fishableLocations(s.level, s.upgrades, s.questItems)) {
        if (!knownAreas.has(id)) {
          knownAreas.add(id);
          mark(`omraade_${id}`);
          needLocationChoice = true;
        }
      }
    };

    const sell = () => {
      const toSell = s.inventory.filter((f) => !KEEP_ON_SELL.has(f.itemType));
      if (toSell.length === 0) return;
      const total = toSell.reduce((sum, f) => sum + (Number(f.value) || 0), 0);
      const bonus = getFinalStreakBonus(s.streak, false, total || 1);
      s.coins += total + bonus;
      earned += total + bonus;
      s.inventory = s.inventory.filter((f) => KEEP_ON_SELL.has(f.itemType));
      s.streak = 0;
      advance(TIMING.sellSec);
    };

    const shop = () => {
      for (const id of buyOrder) {
        if (s.upgrades.includes(id)) continue;
        if (!isEligible(id, s.level, s.upgrades)) continue;
        const cost = SHOP_BY_ID.get(id)!.cost;
        if (s.coins < cost) return; // sparer op til denne
        s.coins -= cost;
        s.upgrades = [...s.upgrades, id];
        if (id === 'map_right') s.questItems = [...s.questItems, 'map_right'];
        advance(TIMING.buySec);
        mark(`koeb_${id}`);
        needLocationChoice = true;
      }
    };

    const chooseLocation = () => {
      const options = fishableLocations(s.level, s.upgrades, s.questItems);
      let best = s.location;
      let bestEv = -1;
      for (const id of options) {
        const ev = expectedValuePerCast(s, id, sampleSize);
        if (ev > bestEv) {
          bestEv = ev;
          best = id;
        }
      }
      if (best !== s.location) {
        s.location = best;
        advance(TIMING.travelSec);
        mark(`rejst_${best}`);
      }
      needLocationChoice = false;
    };

    /** Én kamp: returnerer om fisken blev fanget. Tidsgrænsen nulstilles pr. regnestykke (MathChallenge). */
    const fight = (c: RollCatchResult): boolean => {
      const entry = getEnrichedCatchEntryForRoll(c);
      const stages = entry?.fightParams?.requiredAnswers ?? 1;
      const limit = fightTimeLimitSec(entry, s.upgrades);
      for (let stage = 0; stage < stages; stage++) {
        let timeLeft = limit;
        for (;;) {
          // Svartid varierer ±50 % omkring gennemsnittet.
          const answer = profile.secondsPerAnswer * (0.5 + rand());
          if (answer >= timeLeft) {
            advance(timeLeft);
            return false;
          }
          timeLeft -= answer;
          advance(answer);
          if (rand() < profile.correctRate) break;
          if (!STREAK_EXCEPTION_TYPES.has(c.itemType)) s.streak = 0;
          timeLeft -= TIMING.wrongPenaltySec;
          if (timeLeft <= 0) return false;
        }
      }
      return true;
    };

    mark('level_1');
    while (t < endSec) {
      checkAreas();
      const tier = getBucketTier(s.upgrades);
      if (inventoryBucketCount(s.inventory) >= tier.capacity) {
        sell();
        shop();
        checkAreas();
      }
      if (needLocationChoice) chooseLocation();

      // Kast og vent på bid.
      const biteSpan = TIMING.biteSpanSec - (s.upgrades.includes('reel_upgrade') ? TIMING.reelShaveSec : 0);
      advance(TIMING.castSec + TIMING.biteMinSec + rand() * biteSpan + TIMING.reactSec);

      const c = rollForCatch(rollParams(s));
      const won = fight(c);
      const category = categorize(c);
      if (!won) {
        catches.push({ location: s.location, category, won: false, value: 0 });
        advance(TIMING.lostPanelSec);
        continue;
      }

      let value = Number(c.value) || 0;
      value += calculateStreakBonus(s.streak + 1, false, value);
      if (!DEFERRED_REWARD.has(c.itemType)) {
        const xpAmt = xpForCatch(c) + (s.upgrades.includes('luxury_boat') ? 15 : 0);
        const r = applyXP(s.level, s.xp, xpAmt);
        s.xp = r.xp;
        if (r.level !== s.level) {
          s.level = r.level;
          for (const lv of r.levelUps) mark(`level_${lv}`);
          needLocationChoice = true;
        }
      }
      if (INVENTORY_TYPES.has(c.itemType) && !(NEEDS_BUCKET_SPACE.has(c.itemType) && inventoryBucketCount(s.inventory) >= tier.capacity)) {
        s.inventory.push({ ...c, value });
      }
      if (c.itemType === 'bottle' && !s.questItems.includes('map_left')) {
        s.questItems = [...s.questItems, 'map_left'];
        mark('fundet_map_left');
      }
      s.junkStreak = c.itemType === 'junk' ? s.junkStreak + 1 : 0;
      s.streak += 1;
      if (category.startsWith('kiste')) mark('foerste_kiste');
      catches.push({ location: s.location, category, won: true, value });
      advance(TIMING.resultPanelSec);
    }

    return {
      profileId: profile.id,
      minutes,
      milestones,
      earnedByMinute,
      levelByMinute,
      catches,
      secondsByLocation,
      final: { level: s.level, coins: s.coins, earned, upgrades: s.upgrades },
    };
  });
}

// ─── Fangsttabel uafhængig af spillere ───────────────────────────────────────

/** Fordeling af kategorier pr. 100 kast på et sted, med givet level og udstyr. */
export function catchTable(
  locationId: string,
  level: number,
  upgrades: string[],
  rolls: number,
  seed: number,
): { perHundred: Record<CatchCategory, number>; avgValue: number } {
  return withSeed(seed, () => {
    // Flaskeposten er fundet (den kommer kun, indtil man har venstre halvdel af kortet).
    const s: PlayerState = {
      level, xp: 0, coins: 0, upgrades, questItems: ['map_left'], inventory: [], streak: 0, junkStreak: 0, location: locationId,
    };
    const counts: Partial<Record<CatchCategory, number>> = {};
    let value = 0;
    for (let i = 0; i < rolls; i++) {
      const c = rollForCatch(rollParams(s));
      const cat = categorize(c);
      counts[cat] = (counts[cat] ?? 0) + 1;
      if (INVENTORY_TYPES.has(c.itemType) && !KEEP_ON_SELL.has(c.itemType)) value += Number(c.value) || 0;
      s.junkStreak = c.itemType === 'junk' ? s.junkStreak + 1 : 0;
    }
    const perHundred = {} as Record<CatchCategory, number>;
    for (const [k, v] of Object.entries(counts)) perHundred[k as CatchCategory] = (v! / rolls) * 100;
    return { perHundred, avgValue: value / rolls };
  });
}
