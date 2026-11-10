import { describe, it, expect } from 'vitest';
import { FIGHT_PARAMS, TRUE_BOSS_IDS } from '../src/data/combat.js';
import { ENRICHED_CATCH_DATA, matchesLocation } from '../src/data/enrichment.js';
import { BUCKET_TIERS, ROD_TIERS, getBucketTier, getRodTier } from '../src/data/equipment.js';
import { CATCH_MASTER_DATA } from '../src/data/fish.js';
import { LOCATIONS } from '../src/data/locations.js';
import {
  FARVANDE,
  LETTE_REGNEHISTORIE_TEMPLATES,
  REGNEHISTORIE_TEMPLATES,
} from '../src/data/math-config.js';
import { ARCTIC_SET, DESERT_SET, GOALS } from '../src/data/progression.js';
import { SHOP_ITEMS } from '../src/data/shop.js';
import { emptyStats } from '../src/logic/xp-engine.js';

describe('data integrity', () => {
  it('alle fangster har unikke id', () => {
    const ids = CATCH_MASTER_DATA.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('primaryAreas refererer til kendte lokationer eller all', () => {
    const locKeys = new Set(Object.keys(LOCATIONS));
    locKeys.add('all');
    for (const e of CATCH_MASTER_DATA) {
      for (const a of e.primaryAreas) {
        expect(locKeys.has(a), `${e.id} → ${a}`).toBe(true);
      }
    }
  });
});

const SHOP_IDS = new Set(SHOP_ITEMS.map((i) => i.id));

describe('fangstdata', () => {
  it('alle fangster har navn, og vægtintervallet er gyldigt', () => {
    for (const e of ENRICHED_CATCH_DATA) {
      expect(e.name.length, e.id).toBeGreaterThan(0);
      const [min, max] = e.weightRange;
      expect(min, `${e.id} min-vægt`).toBeGreaterThanOrEqual(0);
      expect(max, `${e.id} max-vægt`).toBeGreaterThanOrEqual(min);
    }
  });

  it('værdi, XP og lodtrækningsvægt er aldrig negative', () => {
    for (const e of ENRICHED_CATCH_DATA) {
      expect(e.baseValue, `${e.id} værdi`).toBeGreaterThanOrEqual(0);
      expect(e.baseXP, `${e.id} XP`).toBeGreaterThanOrEqual(0);
      expect(e.lootWeight, `${e.id} vægt`).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(e.baseValue + e.baseXP + e.lootWeight), e.id).toBe(true);
    }
  });

  it('alle fangster har mindst ét sted', () => {
    for (const e of CATCH_MASTER_DATA) {
      expect(e.primaryAreas.length, e.id).toBeGreaterThan(0);
    }
  });

  it('krævet udstyr kan købes i butikken', () => {
    for (const e of CATCH_MASTER_DATA) {
      const { requiredRod, requiredUpgrade } = e.requirements;
      if (requiredRod) expect(SHOP_IDS.has(requiredRod), `${e.id}: ${requiredRod}`).toBe(true);
      if (requiredUpgrade) {
        expect(SHOP_IDS.has(requiredUpgrade), `${e.id}: ${requiredUpgrade}`).toBe(true);
      }
    }
  });

  it('alle bosser findes i data og har kampregler', () => {
    const byId = new Map(CATCH_MASTER_DATA.map((e) => [e.id, e]));
    for (const id of TRUE_BOSS_IDS) {
      const e = byId.get(id);
      expect(e, id).toBeDefined();
      expect(Object.keys(FIGHT_PARAMS), `${id}: ${e!.itemType}`).toContain(e!.itemType);
    }
  });

  it('hvert fiskested har almindelige fisk, der kan fanges uden udstyr', () => {
    for (const [id, loc] of Object.entries(LOCATIONS)) {
      if ((loc.specialRules as { noFishing?: boolean }).noFishing) continue;
      const open = ENRICHED_CATCH_DATA.filter(
        (e) =>
          e.type === 'fish' &&
          e.rarity === 'Almindelig' &&
          matchesLocation(e, id) &&
          !e.requirements.requiredRod &&
          !e.requirements.requiredUpgrade &&
          !e.requirements.requiredBait,
      );
      expect(open.length, id).toBeGreaterThan(0);
    }
  });
});

describe('lokationer', () => {
  it('nøglen i tabellen er lokationens id', () => {
    for (const [key, loc] of Object.entries(LOCATIONS)) {
      expect(loc.id, key).toBe(key);
      expect(loc.name.length, key).toBeGreaterThan(0);
      expect(loc.unlockLevel, key).toBeGreaterThanOrEqual(1);
    }
  });

  it('molen er åben fra start', () => {
    expect(LOCATIONS.pier.unlockLevel).toBe(1);
    expect(LOCATIONS.pier.requiresItem).toBeNull();
  });

  it('rejse- og fiskekrav peger på varer i butikken', () => {
    for (const [key, loc] of Object.entries(LOCATIONS)) {
      const l = loc as { travelRequires?: string; fishRequires?: string };
      if (l.travelRequires) expect(SHOP_IDS.has(l.travelRequires), `${key} rejse`).toBe(true);
      if (l.fishRequires) expect(SHOP_IDS.has(l.fishRequires), `${key} fiskeri`).toBe(true);
    }
  });
});

describe('butik og udstyr', () => {
  it('varer har unikke id’er, og priser og level-krav er gyldige', () => {
    const ids = SHOP_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of SHOP_ITEMS) {
      expect(item.name.length, item.id).toBeGreaterThan(0);
      expect(Number.isInteger(item.cost), `${item.id} pris`).toBe(true);
      // Belønninger (fx Sørøverens Hat) koster 0; ingen vare må have negativ pris.
      expect(item.cost, `${item.id} pris`).toBeGreaterThanOrEqual(0);
      expect(item.requiredLevel, `${item.id} level`).toBeGreaterThanOrEqual(1);
    }
  });

  it('forudsætninger peger på andre varer, og kæden ender uden ring', () => {
    const byId = new Map(SHOP_ITEMS.map((i) => [i.id, i]));
    for (const item of SHOP_ITEMS) {
      const seen = new Set<string>([item.id]);
      let cur = item;
      while (cur.requiresUpgrade) {
        const next = byId.get(cur.requiresUpgrade);
        expect(next, `${cur.id} kræver ${cur.requiresUpgrade}`).toBeDefined();
        expect(seen.has(next!.id), `ring ved ${item.id}`).toBe(false);
        seen.add(next!.id);
        cur = next!;
      }
    }
  });

  it('ørken- og vintersættet kan købes', () => {
    for (const id of [...DESERT_SET, ...ARCTIC_SET]) expect(SHOP_IDS.has(id), id).toBe(true);
  });

  it('spande og stænger kan købes og bliver bedre for hvert trin', () => {
    for (const tiers of [BUCKET_TIERS, ROD_TIERS]) {
      expect(tiers[0]!.id).toBeNull();
      for (const t of tiers.slice(1)) expect(SHOP_IDS.has(t.id!), String(t.id)).toBe(true);
    }
    for (let i = 1; i < BUCKET_TIERS.length; i++) {
      expect(BUCKET_TIERS[i]!.capacity).toBeGreaterThan(BUCKET_TIERS[i - 1]!.capacity);
    }
    for (let i = 1; i < ROD_TIERS.length; i++) {
      expect(ROD_TIERS[i]!.timeBonus).toBeGreaterThan(ROD_TIERS[i - 1]!.timeBonus);
    }
  });

  it('spilleren får det bedste udstyr, de ejer', () => {
    expect(getBucketTier([]).capacity).toBe(5);
    expect(getBucketTier(['bucket_iron', 'bucket_gold', 'bucket_copper']).id).toBe('bucket_gold');
    expect(getRodTier([]).id).toBeNull();
    expect(getRodTier(['rod_mahogni', 'rod_havblaa']).id).toBe('rod_mahogni');
    expect(getRodTier(['magnet']).id).toBeNull();
  });
});

describe('mål', () => {
  it('har unikke id’er, titel og ikke-negative belønninger', () => {
    const ids = GOALS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of GOALS) {
      expect(g.title.length, g.id).toBeGreaterThan(0);
      expect(g.description.length, g.id).toBeGreaterThan(0);
      expect(g.reward.xp, g.id).toBeGreaterThanOrEqual(0);
      expect(g.reward.coins, g.id).toBeGreaterThanOrEqual(0);
    }
  });

  it('ingen mål er opfyldt for en helt ny spiller', () => {
    const fresh = emptyStats();
    for (const g of GOALS) {
      expect(g.condition(fresh), g.id).toBe(false);
    }
  });
});

describe('matematik-skabeloner', () => {
  it('regnehistorier har de pladsholdere, regnearten skal bruge', () => {
    for (const t of REGNEHISTORIE_TEMPLATES) {
      if (t.type === '/') {
        expect(t.template, t.template).toContain('{total}');
        expect(t.template, t.template).toContain('{div}');
        expect(t.divOptions.length).toBeGreaterThan(0);
        for (const d of t.divOptions) expect(d).toBeGreaterThan(1);
      } else {
        expect(t.template, t.template).toContain('{a}');
        expect(t.template, t.template).toContain('{b}');
        expect(t.minA).toBeLessThanOrEqual(t.maxA);
        expect(t.minB).toBeLessThanOrEqual(t.maxB);
        expect(t.minA).toBeGreaterThan(0);
        expect(t.minB).toBeGreaterThan(0);
      }
      expect(t.template.replace(/\{(a|b|total|div)\}/g, ''), t.template).not.toMatch(/[{}\d]/);
      expect(t.unit.length).toBeGreaterThan(0);
    }
  });

  it('lette historier holder sig inden for 10 for begyndere', () => {
    for (const t of LETTE_REGNEHISTORIE_TEMPLATES) {
      expect(t.template, t.template).toContain('{a}');
      expect(t.template, t.template).toContain('{b}');
      expect(t.minA).toBeGreaterThan(0);
      expect(t.minB).toBeGreaterThan(0);
      expect(t.minA).toBeLessThanOrEqual(t.maxA);
      expect(t.minB).toBeLessThanOrEqual(t.maxB);
      expect(t.maxA + t.maxB, t.template).toBeLessThanOrEqual(10);
      expect(t.template.replace(/\{(a|b)\}/g, ''), t.template).not.toMatch(/[{}\d]/);
    }
  });

  it('hvert farvand tilbyder plus, så der altid kan laves en opgave', () => {
    for (const [id, fv] of Object.entries(FARVANDE)) {
      expect(fv.allowedMathTypes as readonly string[], id).toContain('plus');
    }
  });
});
