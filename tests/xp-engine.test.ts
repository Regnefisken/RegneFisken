import { describe, expect, it } from 'vitest';
import { ENRICHED_CATCH_DATA } from '../src/data/enrichment.js';
import { XP_REWARDS, xpNeededForLevel } from '../src/data/xp.js';
import {
  applyXP,
  calculateStreakBonus,
  emptyStats,
  getFinalStreakBonus,
  xpForCatch,
} from '../src/logic/xp-engine.js';
import type { RollCatchResult } from '../src/types/fish.js';

function baseCatch(over: Partial<RollCatchResult>): RollCatchResult {
  return {
    id: 'x',
    species: 'Test',
    weight: 1,
    value: 0,
    rarity: 'Almindelig',
    color: 0x888888,
    itemType: 'fish',
    ...over,
  };
}

describe('xpNeededForLevel', () => {
  it('stiger lineært med 75 pr. level op til level 10', () => {
    expect(xpNeededForLevel(1)).toBe(100);
    expect(xpNeededForLevel(2)).toBe(175);
    expect(xpNeededForLevel(5)).toBe(400);
    expect(xpNeededForLevel(10)).toBe(775);
  });

  it('bruger eksponentiel faktor fra level 11', () => {
    expect(xpNeededForLevel(11)).toBe(Math.floor(850 * 1.06));
    expect(xpNeededForLevel(12)).toBe(Math.floor(925 * 1.06 ** 2));
  });

  it('er et positivt heltal og strengt voksende for level 1–100', () => {
    let prev = 0;
    for (let lvl = 1; lvl <= 100; lvl++) {
      const need = xpNeededForLevel(lvl);
      expect(Number.isInteger(need), `level ${lvl}`).toBe(true);
      expect(need, `level ${lvl}`).toBeGreaterThan(prev);
      prev = need;
    }
  });
});

describe('applyXP', () => {
  it('lægger XP til uden level-up under grænsen', () => {
    expect(applyXP(1, 0, 99)).toEqual({ level: 1, xp: 99, levelUps: [] });
  });

  it('giver level-up præcis på grænsen og nulstiller XP', () => {
    expect(applyXP(1, 0, 100)).toEqual({ level: 2, xp: 0, levelUps: [2] });
    expect(applyXP(1, 60, 40)).toEqual({ level: 2, xp: 0, levelUps: [2] });
  });

  it('kan give flere level-ups på én gang og bærer resten videre', () => {
    // 100 (lvl 1) + 175 (lvl 2) + 250 (lvl 3) = 525
    expect(applyXP(1, 0, 525 + 7)).toEqual({ level: 4, xp: 7, levelUps: [2, 3, 4] });
  });

  it('nul XP ændrer ingenting', () => {
    expect(applyXP(7, 33, 0)).toEqual({ level: 7, xp: 33, levelUps: [] });
  });

  it('bevarer den samlede XP-mængde (intet går tabt ved level-up)', () => {
    const totalAt = (level: number, xp: number) => {
      let sum = xp;
      for (let l = 1; l < level; l++) sum += xpNeededForLevel(l);
      return sum;
    };
    for (const amount of [1, 50, 99, 100, 101, 999, 5000, 123456]) {
      const r = applyXP(3, 20, amount);
      expect(totalAt(r.level, r.xp), `amount ${amount}`).toBe(totalAt(3, 20) + amount);
      expect(r.xp).toBeGreaterThanOrEqual(0);
      expect(r.xp).toBeLessThan(xpNeededForLevel(r.level));
      expect(r.levelUps.length).toBe(r.level - 3);
    }
  });
});

describe('xpForCatch', () => {
  it('bruger xpReward på fangsten når den er sat (også 0)', () => {
    expect(xpForCatch(baseCatch({ xpReward: 42 }))).toBe(42);
    expect(xpForCatch(baseCatch({ xpReward: 0, rarity: 'Legendarisk' }))).toBe(0);
  });

  it('giver faste værdier for skrald og skatte uden xpReward', () => {
    expect(xpForCatch(baseCatch({ itemType: 'junk', rarity: 'Skrald' }))).toBe(XP_REWARDS.item.junk);
    expect(xpForCatch(baseCatch({ itemType: 'treasure' }))).toBe(XP_REWARDS.item.treasure);
  });

  it('falder tilbage til sjældenhed når fisken ikke findes i data', () => {
    expect(xpForCatch(baseCatch({ rarity: 'Almindelig' }))).toBe(10);
    expect(xpForCatch(baseCatch({ rarity: 'Sjælden' }))).toBe(25);
    expect(xpForCatch(baseCatch({ rarity: 'Legendarisk' }))).toBe(60);
  });

  it('ukendt sjældenhed giver XP som en almindelig fisk', () => {
    expect(xpForCatch(baseCatch({ rarity: 'Findes ikke' }))).toBe(XP_REWARDS.fish.Almindelig);
  });

  it('bruger baseXP fra fiskedata når fishModelId er kendt', () => {
    const entry = ENRICHED_CATCH_DATA.find((e) => e.type === 'fish')!;
    expect(xpForCatch(baseCatch({ fishModelId: entry.id, rarity: String(entry.rarity) }))).toBe(
      entry.baseXP,
    );
  });

  it('giver aldrig negativ eller ugyldig XP for nogen fangst i data', () => {
    for (const e of ENRICHED_CATCH_DATA) {
      const xp = xpForCatch(
        baseCatch({ fishModelId: e.id, rarity: String(e.rarity), itemType: String(e.itemType) }),
      );
      expect(Number.isFinite(xp), e.id).toBe(true);
      expect(xp, e.id).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('streak-bonus', () => {
  it('giver ingen bonus under 5 i træk', () => {
    for (let s = 0; s < 5; s++) {
      expect(calculateStreakBonus(s, false, 10)).toBe(0);
      expect(calculateStreakBonus(s, true, 10)).toBe(0);
    }
  });

  it('giver ingen bonus når fangsten er værdiløs', () => {
    expect(calculateStreakBonus(20, false, 0)).toBe(0);
    expect(calculateStreakBonus(20, true, 0)).toBe(0);
    expect(calculateStreakBonus(20, false)).toBe(0);
  });

  it('giver 3 mønter pr. fulde 5 i træk i normal tilstand', () => {
    expect(calculateStreakBonus(5, false, 10)).toBe(3);
    expect(calculateStreakBonus(9, false, 10)).toBe(3);
    expect(calculateStreakBonus(10, false, 10)).toBe(6);
    expect(calculateStreakBonus(27, false, 10)).toBe(15);
  });

  it('giver streak-tallet som bonus i zen-tilstand', () => {
    expect(calculateStreakBonus(5, true, 10)).toBe(5);
    expect(calculateStreakBonus(12, true, 10)).toBe(12);
  });

  it('getFinalStreakBonus regner med en værdi på 1 som standard', () => {
    expect(getFinalStreakBonus(10, false)).toBe(6);
    expect(getFinalStreakBonus(10, false, 0)).toBe(0);
  });
});

describe('emptyStats', () => {
  it('starter på level 1 med molen som eneste besøgte sted', () => {
    const s = emptyStats();
    expect(s.maxLevel).toBe(1);
    expect(s.areasVisited).toEqual(['pier']);
    expect(s.totalCatches).toBe(0);
  });

  it('returnerer et nyt objekt hver gang (ingen delte lister)', () => {
    const a = emptyStats();
    const b = emptyStats();
    a.areasVisited.push('abyss');
    a.solvedCategories.push('basic');
    expect(b.areasVisited).toEqual(['pier']);
    expect(b.solvedCategories).toEqual([]);
  });
});
