import { describe, expect, it } from 'vitest';
import { ROD_TIERS } from '../src/data/equipment.js';
import { ENRICHED_CATCH_DATA } from '../src/data/enrichment.js';
import { DEFAULT_FIGHT_TIME_SEC, fightTimeLimitSec } from '../src/logic/fight-time.js';

const fish = ENRICHED_CATCH_DATA.find((e) => e.type === 'fish' && !e.fightParams.baseTimeLimit)!;
const shark = ENRICHED_CATCH_DATA.find((e) => e.id === 'fisk_hvidhaj')!;

describe('tid pr. regnestykke', () => {
  it('er 25 sekunder uden stang og uden fangst', () => {
    expect(DEFAULT_FIGHT_TIME_SEC).toBe(25);
    expect(fightTimeLimitSec(undefined, [])).toBe(25);
    expect(fightTimeLimitSec(fish, [])).toBe(25);
  });

  it('lægger stangens tidsbonus til, som udstyrsfanen viser', () => {
    expect(fightTimeLimitSec(fish, ['rod_havblaa'])).toBe(27);
    expect(fightTimeLimitSec(fish, ['rod_havblaa', 'rod_bambus'])).toBe(30);
    expect(fightTimeLimitSec(fish, ['rod_havblaa', 'rod_bambus', 'rod_mahogni'])).toBe(34);
  });

  it('bruger den bedste stang, man ejer', () => {
    expect(fightTimeLimitSec(fish, ['rod_mahogni'])).toBe(34);
  });

  it('lægger bonussen oven i fangstens egen tidsgrænse', () => {
    expect(shark.fightParams.baseTimeLimit).toBe(30);
    expect(fightTimeLimitSec(shark, [])).toBe(30);
    expect(fightTimeLimitSec(shark, ['rod_bambus'])).toBe(35);
  });

  it('stængernes bonus stiger med stangen', () => {
    const bonuses = ROD_TIERS.map((r) => r.timeBonus);
    expect(bonuses).toEqual([...bonuses].sort((a, b) => a - b));
    expect(bonuses[0]).toBe(0);
  });
});
