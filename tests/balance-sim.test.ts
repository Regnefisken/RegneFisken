import { describe, expect, it, vi } from 'vitest';
import { SHOP_ITEMS } from '../src/data/shop.js';
import {
  DEFAULT_BUY_ORDER,
  DEFAULT_PROFILES,
  canFishAt,
  catchTable,
  fishableLocations,
  simulatePlayer,
} from '../scripts/balance/sim-core.js';
import { evaluateGoals, findAnomalies, longestGap, renderGoals } from '../scripts/balance/goals.js';

vi.mock('../src/audio/audioEngine.js');

const middel = DEFAULT_PROFILES.find((p) => p.id === 'middel')!;

describe('balance-simulatoren', () => {
  it('giver samme resultat med samme frø', () => {
    const a = simulatePlayer({ profile: middel, minutes: 20, seed: 42, locationSampleSize: 50 });
    const b = simulatePlayer({ profile: middel, minutes: 20, seed: 42, locationSampleSize: 50 });
    expect(a.final).toEqual(b.final);
    expect(a.catches.length).toBe(b.catches.length);
  });

  it('en spiller fisker, tjener penge og stiger i level', () => {
    const r = simulatePlayer({ profile: middel, minutes: 30, seed: 7, locationSampleSize: 50 });
    expect(r.catches.length).toBeGreaterThan(30);
    expect(r.final.earned).toBeGreaterThan(0);
    expect(r.final.level).toBeGreaterThan(1);
    expect(r.milestones.level_2).toBeLessThan(30);
    // Tjent er altid mindst det, der er tilbage, og ikke-faldende minut for minut.
    expect(r.final.earned).toBeGreaterThanOrEqual(r.final.coins);
    for (let m = 1; m < r.earnedByMinute.length; m++) {
      expect(r.earnedByMinute[m]!).toBeGreaterThanOrEqual(r.earnedByMinute[m - 1]!);
    }
  });

  it('den stærke regner kommer hurtigere frem end den usikre', () => {
    const svag = DEFAULT_PROFILES.find((p) => p.id === 'svag')!;
    const staerk = DEFAULT_PROFILES.find((p) => p.id === 'staerk')!;
    const s = simulatePlayer({ profile: svag, minutes: 40, seed: 3, locationSampleSize: 50 });
    const t = simulatePlayer({ profile: staerk, minutes: 40, seed: 3, locationSampleSize: 50 });
    expect(t.final.earned).toBeGreaterThan(s.final.earned);
  });

  it('indkøbslisten kun indeholder varer, der findes i butikken', () => {
    const ids = new Set(SHOP_ITEMS.map((i) => i.id));
    for (const id of DEFAULT_BUY_ORDER) expect(ids.has(id), id).toBe(true);
  });

  it('følger kast-reglerne for tilladelser og stænger', () => {
    expect(canFishAt('pier', [])).toBe(true);
    expect(canFishAt('smaragd', [])).toBe(false);
    expect(canFishAt('smaragd', ['license_smaragd'])).toBe(true);
    expect(canFishAt('abyss', ['license_abyss'])).toBe(false);
    expect(canFishAt('abyss', ['license_abyss', 'rod_bambus'])).toBe(true);
    expect(canFishAt('cave', ['headlamp'])).toBe(false);
    expect(canFishAt('cave', ['headlamp', 'rod_mahogni'])).toBe(true);
    expect(canFishAt('cabin_living', ['magnet'])).toBe(false);
  });

  it('en ny spiller kan kun fiske ved molen', () => {
    expect(fishableLocations(1, [], [])).toEqual(['pier']);
  });

  it('balancemålene kan evalueres og vises', () => {
    const byId = Object.fromEntries(
      DEFAULT_PROFILES.map((p, i) => [p.id, [simulatePlayer({ profile: p, minutes: 30, seed: 100 + i, locationSampleSize: 30 })]]),
    );
    const ctx = { byId, minutes: 30, seed: 1 };
    const goals = evaluateGoals(ctx);
    expect(goals.map((g) => g.nr)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    for (const g of goals) {
      expect(['ok', 'fejl', 'uafklaret']).toContain(g.status);
      expect(g.measured.length, `mål ${g.nr}`).toBeGreaterThan(0);
    }
    const md = renderGoals(goals, findAnomalies(ctx));
    expect(md).toContain('## Røde flag');
    expect(md).toContain('### Automatiske fund');
  });

  it('længste pause tæller frem til slut, indtil alt er købt', () => {
    const base = simulatePlayer({ profile: middel, minutes: 10, seed: 1, locationSampleSize: 30 });
    const r = { ...base, minutes: 60, milestones: { level_1: 0, level_2: 5, koeb_bucket_iron: 20 } };
    expect(longestGap(r)).toBe(40);
    const all = Object.fromEntries(DEFAULT_BUY_ORDER.map((id, i) => [`koeb_${id}`, i + 1]));
    expect(longestGap({ ...base, minutes: 600, milestones: { level_1: 0, ...all } })).toBe(1);
  });

  it('fangsttabellen summerer til 100 pr. 100 kast', () => {
    const { perHundred } = catchTable('pier', 5, [], 2000, 1);
    const sum = Object.values(perHundred).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 6);
  });
});
