import { afterEach, describe, expect, it, vi } from 'vitest';
import { naturalCollectibleRateMultiplier } from '../src/data/collectible-catch-saturation.js';
import { ENRICHED_CATCH_DATA, matchesLocation } from '../src/data/enrichment.js';
import { LOCATIONS } from '../src/data/locations.js';
import {
  computeAdditiveDR,
  computeAdditiveVR,
  createJunkItem,
  getRequirementText,
  makeId,
  rollCatchDisplayColor,
  rollForCatch,
  weightedFishPick,
} from '../src/logic/catch-engine.js';
import { getRarityWeights, rollRarityPipeline } from '../src/logic/rarity.js';
import type { EnrichedCatchEntry, RollCatchResult } from '../src/types/fish.js';
import { fixRandom, sequenceRandom } from './helpers/random.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const LOCATION_IDS = Object.keys(LOCATIONS);
const entryById = new Map(ENRICHED_CATCH_DATA.map((e) => [e.id, e]));

function expectValidCatch(c: RollCatchResult, label: string): void {
  expect(typeof c.id, label).toBe('string');
  expect(c.id.length, label).toBeGreaterThan(0);
  expect(c.species.length, label).toBeGreaterThan(0);
  expect(c.itemType.length, label).toBeGreaterThan(0);
  expect(c.rarity.length, label).toBeGreaterThan(0);
  expect(Number.isFinite(c.weight), `${label} vægt`).toBe(true);
  expect(c.weight, `${label} vægt`).toBeGreaterThanOrEqual(0);
  expect(Number.isFinite(c.value), `${label} værdi`).toBe(true);
  expect(c.value, `${label} værdi`).toBeGreaterThanOrEqual(0);
  expect(Number.isInteger(c.color), `${label} farve`).toBe(true);
  expect(c.color, `${label} farve`).toBeGreaterThanOrEqual(0);
  expect(c.color, `${label} farve`).toBeLessThanOrEqual(0xffffff);
}

describe('computeAdditiveDR / computeAdditiveVR', () => {
  it('er 0 uden udstyr og uden aktiv madding', () => {
    expect(computeAdditiveDR(1000, [], 0, 0, 0, 0)).toBe(0);
    expect(computeAdditiveVR([])).toBe(0);
  });

  it('lægger udstyr og aktive maddinger sammen', () => {
    expect(computeAdditiveDR(1000, ['heldig_firkloever'], 0, 0, 0, 0)).toBe(8);
    expect(computeAdditiveDR(1000, ['pirate_hat'], 0, 0, 0, 0)).toBe(5);
    expect(computeAdditiveDR(1000, [], 2000, 0, 0, 0)).toBe(6);
    expect(computeAdditiveDR(1000, [], 0, 2000, 0, 0)).toBe(12);
    expect(computeAdditiveDR(1000, [], 0, 0, 2000, 0)).toBe(15);
    expect(computeAdditiveDR(1000, [], 0, 0, 0, 2000)).toBe(15);
    expect(
      computeAdditiveDR(1000, ['heldig_firkloever', 'pirate_hat'], 2000, 2000, 2000, 2000),
    ).toBe(61);
  });

  it('udløbet madding tæller ikke (udløb præcis nu er udløbet)', () => {
    expect(computeAdditiveDR(1000, [], 1000, 1000, 1000, 1000)).toBe(0);
    expect(computeAdditiveDR(1000, [], 999, 999, 999, 999)).toBe(0);
  });

  it('guldkrog giver +15 i værdi', () => {
    expect(computeAdditiveVR(['golden_hook'])).toBe(15);
    expect(computeAdditiveVR(['rod_bambus'])).toBe(0);
  });
});

describe('getRarityWeights / rollRarityPipeline', () => {
  it('giver positive vægte på alle levels og med stor bonus', () => {
    for (const level of [1, 3, 8, 20, 100]) {
      for (const dr of [0, 20, 61, 500]) {
        const w = getRarityWeights(level, dr);
        for (const [k, v] of Object.entries(w)) {
          expect(v, `${k} level ${level} dr ${dr}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('højere level og bonus gør sjældne fisk mere sandsynlige', () => {
    const share = (w: ReturnType<typeof getRarityWeights>) =>
      (w.rare + w.legendary) / (w.common + w.rare + w.legendary + w.mystisk);
    expect(share(getRarityWeights(10, 0))).toBeGreaterThan(share(getRarityWeights(1, 0)));
    expect(share(getRarityWeights(5, 30))).toBeGreaterThan(share(getRarityWeights(5, 0)));
  });

  it('vælger efter vægt i rækkefølgen mystisk → legendarisk → sjælden → almindelig', () => {
    const w = { mystisk: 1, legendary: 1, rare: 3, common: 5 };
    fixRandom(0);
    expect(rollRarityPipeline(w)).toBe('mystisk');
    fixRandom(0.15);
    expect(rollRarityPipeline(w)).toBe('legendary');
    fixRandom(0.4);
    expect(rollRarityPipeline(w)).toBe('rare');
    fixRandom(0.999);
    expect(rollRarityPipeline(w)).toBe('common');
  });
});

describe('naturalCollectibleRateMultiplier', () => {
  it('sænker først raten når 10 er afleveret', () => {
    expect(naturalCollectibleRateMultiplier(0)).toBe(1);
    expect(naturalCollectibleRateMultiplier(9)).toBe(1);
    expect(naturalCollectibleRateMultiplier(10)).toBe(0.3);
    expect(naturalCollectibleRateMultiplier(50)).toBe(0.3);
  });
});

describe('weightedFishPick', () => {
  const entries = [
    { id: 'a', lootWeight: 1 },
    { id: 'b', lootWeight: 3 },
    { id: 'c', lootWeight: 0 },
  ] as unknown as EnrichedCatchEntry[];

  it('vælger efter vægt', () => {
    fixRandom(0);
    expect(weightedFishPick(entries).id).toBe('a');
    fixRandom(0.5);
    expect(weightedFishPick(entries).id).toBe('b');
  });

  it('returnerer altid et element — også lige under 1', () => {
    fixRandom(0.999999);
    expect(weightedFishPick(entries)).toBeDefined();
  });

  it('fordeler sig nogenlunde efter vægtene over mange træk', () => {
    const two = [
      { id: 'sjælden', lootWeight: 1 },
      { id: 'hyppig', lootWeight: 9 },
    ] as unknown as EnrichedCatchEntry[];
    let hyppig = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) if (weightedFishPick(two).id === 'hyppig') hyppig++;
    expect(hyppig / n).toBeGreaterThan(0.85);
    expect(hyppig / n).toBeLessThan(0.95);
  });
});

describe('createJunkItem', () => {
  it('giver gyldigt skrald uden værdi på alle lokationer', () => {
    for (const loc of LOCATION_IDS) {
      for (let i = 0; i < 20; i++) {
        const j = createJunkItem(loc);
        expectValidCatch(j, `skrald ${loc}`);
        expect(j.itemType).toBe('junk');
        expect(j.rarity).toBe('Skrald');
        if (j.fishModelId) {
          const e = entryById.get(j.fishModelId);
          expect(e, j.fishModelId).toBeDefined();
          expect(matchesLocation(e!, loc), `${j.fishModelId} på ${loc}`).toBe(true);
          expect(j.weight).toBeGreaterThanOrEqual(e!.weightRange[0]);
          expect(j.weight).toBeLessThanOrEqual(e!.weightRange[1]);
        }
      }
    }
  });
});

describe('getRequirementText', () => {
  it('uden krav', () => {
    expect(getRequirementText({})).toBe('Ingen specielle krav');
    expect(getRequirementText({ requirements: null })).toBe('Ingen specielle krav');
    expect(getRequirementText({ requirements: { requiredRod: null, requiredBait: null } })).toBe(
      'Ingen specielle krav',
    );
  });

  it('samler flere krav med plus', () => {
    const t = getRequirementText({
      requirements: { requiredRod: 'rod_mahogni', requiredBait: 'bait', requiredUpgrade: 'golden_hook' },
    });
    expect(t.startsWith('Kræver: ')).toBe(true);
    expect(t).toContain('Mahogni-stang');
    expect(t).toContain('Mystisk Madding');
    expect(t).toContain('Guld Krog');
    expect(t.split(' + ').length).toBe(3);
  });
});

describe('rollCatchDisplayColor', () => {
  it('bruger modellens farve når den findes', () => {
    fixRandom(0.9);
    expect(rollCatchDisplayColor('fisk_torsk', 0x123456, 'Almindelig')).toBe(0x123456);
  });

  it('hummer og krabbe har en sjælden farvevariant', () => {
    fixRandom(0.1);
    expect(rollCatchDisplayColor('fisk_hummer', 0x123456, 'Almindelig')).toBe(0xee3333);
    expect(rollCatchDisplayColor('fisk_krabbe', 0x123456, 'Almindelig')).toBe(0xe0b070);
    fixRandom(0.9);
    expect(rollCatchDisplayColor('fisk_hummer', 0x123456, 'Almindelig')).toBe(0x123456);
  });

  it('vælger en farve fra sjældenheden når modellen ingen har', () => {
    const c = rollCatchDisplayColor('ukendt', null, 'Legendarisk');
    expect([0xffd700, 0x9400d3, 0xdc143c]).toContain(c);
    expect(rollCatchDisplayColor('ukendt', undefined, 'Findes ikke')).toBe(0x888888);
  });
});

describe('makeId', () => {
  it('giver unikke, ikke-tomme id’er', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 2000; i++) ids.add(makeId());
    expect(ids.size).toBeGreaterThan(1990);
    for (const id of ids) expect(id.length).toBeGreaterThan(0);
  });
});

describe('rollForCatch — faste udfald', () => {
  it('konkylie-madding kan give konkylie med det samme', () => {
    fixRandom(0);
    const c = rollForCatch({ difficulty: 1, activeConchBait: true, hasMapLeft: true });
    expect(c.itemType).toBe('conch');
  });

  it('fossil-madding kan give fossil', () => {
    fixRandom(0.1);
    const c = rollForCatch({ difficulty: 1, activeFossilBait: true, hasMapLeft: true });
    expect(c.itemType).toBe('fossil');
  });

  it('flaskepost kan kun fanges indtil venstre korthalvdel er fundet', () => {
    fixRandom(0);
    expect(rollForCatch({ difficulty: 1, hasMapLeft: false }).itemType).toBe('bottle');
    expect(rollForCatch({ difficulty: 1, hasMapLeft: true }).itemType).not.toBe('bottle');
  });

  it('høje terningkast giver en almindelig fisk fra molen', () => {
    fixRandom(0.999);
    const c = rollForCatch({ difficulty: 1, hasMapLeft: true, location: 'pier' });
    expect(c.rarity).toBe('Almindelig');
    const e = entryById.get(c.fishModelId!);
    expect(e).toBeDefined();
    expect(matchesLocation(e!, 'pier')).toBe(true);
    expect(['fish', 'treasure']).toContain(e!.type);
  });

  it('guldkrogens værdibonus lægges oven i fiskens grundværdi', () => {
    fixRandom(0.999);
    const uden = rollForCatch({ difficulty: 1, hasMapLeft: true, location: 'pier' });
    const med = rollForCatch({ difficulty: 1, hasMapLeft: true, location: 'pier', additiveVR: 15 });
    expect(med.fishModelId).toBe(uden.fishModelId);
    expect(med.value).toBe(uden.value + 15);
  });

  it('Kraken kræver hvalbøf og kan ikke fanges igen efter sejr', () => {
    // 0.06: over flaskepost (0.05), under boss-chancen (0.1).
    const base = { difficulty: 1, hasMapLeft: true, location: 'forbidden', isBossFight: true };
    fixRandom(0.06);
    expect(rollForCatch({ ...base, hvalbofActive: true }).itemType).toBe('kraken');
    expect(rollForCatch({ ...base, hvalbofActive: false }).itemType).not.toBe('kraken');
    expect(rollForCatch({ ...base, hvalbofActive: true, krakenDefeated: true }).itemType).not.toBe(
      'kraken',
    );
  });

  it('Søuhyret kræver kødklump og kan ikke fanges igen efter sejr', () => {
    const base = { difficulty: 1, hasMapLeft: true, location: 'desert_lake' };
    const count = (extra: object) => {
      let n = 0;
      for (let i = 0; i < 2000; i++) {
        if (rollForCatch({ ...base, ...extra }).itemType === 'soeuhyre') n++;
      }
      return n;
    };
    // Ca. 8 % pr. kast med kødklump — 2000 kast uden et eneste er i praksis umuligt.
    expect(count({ koedklumpActive: true })).toBeGreaterThan(0);
    expect(count({ koedklumpActive: false })).toBe(0);
    expect(count({ koedklumpActive: true, soeuhyreDefeated: true })).toBe(0);
  });

  it('Plesiosaurus kræver Mystisk Madding', () => {
    const plesioLoc = LOCATION_IDS.find(
      (id) => (LOCATIONS as Record<string, { specialRules: { plesioChance?: number } }>)[id]!
        .specialRules.plesioChance,
    );
    expect(plesioLoc).toBeDefined();
    for (let i = 0; i < 3000; i++) {
      const c = rollForCatch({ difficulty: 1, hasMapLeft: true, location: plesioLoc, activeBait: null });
      expect(c.itemType).not.toBe('plesiosaur');
    }
  });

  it('legendarisk madding giver en legendarisk fisk fra stedet', () => {
    sequenceRandom([0.999]);
    const c = rollForCatch({
      difficulty: 1,
      hasMapLeft: true,
      location: 'pier',
      activeBait: 'legendary_bait',
    });
    const legendaryHere = ENRICHED_CATCH_DATA.filter(
      (e) => e.type === 'fish' && e.rarity === 'Legendarisk' && matchesLocation(e, 'pier'),
    );
    if (legendaryHere.length > 0) {
      expect(c.rarity).toBe('Legendarisk');
      expect(legendaryHere.map((e) => e.id)).toContain(c.fishModelId);
    }
  });
});

describe('rollForCatch — holder reglerne over mange kast', () => {
  const ROLLS = 1500;

  it('giver altid en gyldig fangst, der hører til på stedet', () => {
    for (const location of LOCATION_IDS) {
      for (let i = 0; i < ROLLS; i++) {
        const c = rollForCatch({ difficulty: 1, location, level: 1 + (i % 15) });
        expectValidCatch(c, `${location} #${i} (${c.species})`);
        if (c.fishModelId) {
          const e = entryById.get(c.fishModelId);
          expect(e, `${c.fishModelId} findes i data`).toBeDefined();
          expect(matchesLocation(e!, location), `${c.fishModelId} på ${location}`).toBe(true);
        }
      }
    }
  });

  it('giver aldrig fisk, der kræver udstyr eller madding, spilleren ikke har', () => {
    for (const location of LOCATION_IDS) {
      for (let i = 0; i < ROLLS; i++) {
        const c = rollForCatch({ difficulty: 1, location, level: 12, hasMapLeft: true });
        if (!c.fishModelId) continue;
        const e = entryById.get(c.fishModelId)!;
        if (e.type !== 'fish' && e.type !== 'treasure') continue;
        const req = e.requirements ?? { requiredRod: null, requiredBait: null };
        expect(req.requiredRod ?? null, `${e.id} på ${location} kræver stang`).toBeNull();
        expect(req.requiredUpgrade ?? null, `${e.id} på ${location} kræver udstyr`).toBeNull();
        expect(req.requiredBait ?? null, `${e.id} på ${location} kræver madding`).toBeNull();
      }
    }
  });

  it('en bosskamp giver aldrig skrald eller samleobjekter', () => {
    const forbidden = new Set(['junk', 'conch', 'fossil', 'sardine', 'jellyfish', 'oyster', 'plesiosaur']);
    for (const location of LOCATION_IDS) {
      for (let i = 0; i < 600; i++) {
        const c = rollForCatch({
          difficulty: 1,
          location,
          level: 10,
          hasMapLeft: true,
          isBossFight: true,
          activeConchBait: true,
          activeFossilBait: true,
        });
        expect(forbidden.has(c.itemType), `${c.itemType} i bosskamp på ${location}`).toBe(false);
      }
    }
  });

  it('skrald er hverken sjældent eller dominerende på molen', () => {
    let junk = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) {
      if (rollForCatch({ difficulty: 1, location: 'pier', hasMapLeft: true }).itemType === 'junk') junk++;
    }
    // Forventet ca. 11–12 %.
    expect(junk / n).toBeGreaterThan(0.07);
    expect(junk / n).toBeLessThan(0.17);
  });

  it('vægten ligger inden for fiskens vægtinterval', () => {
    for (let i = 0; i < 3000; i++) {
      const c = rollForCatch({ difficulty: 1, location: 'pier', hasMapLeft: true });
      if (c.itemType !== 'fish' || !c.fishModelId) continue;
      const e = entryById.get(c.fishModelId)!;
      expect(c.weight, c.fishModelId).toBeGreaterThanOrEqual(e.weightRange[0]);
      expect(c.weight, c.fishModelId).toBeLessThanOrEqual(e.weightRange[1]);
    }
  });
});
