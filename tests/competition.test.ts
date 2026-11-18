import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  COMPETITION_PRIZE_CODE_ENTRIES,
  findCompetitionPrizeByCode,
} from '../src/data/competitionPrizeCodes.js';
import {
  FISHING_COMPETITION_DURATION_MS,
  FISHING_COMPETITION_IDLE_TIME_LABEL,
  competitionTimeLeft,
} from '../src/data/fishingCompetition.js';
import { QUEST_COMPANION_DEFAULTS, getFurnitureDisplayLabel } from '../src/data/furnitureShopItems.js';
import {
  competitionPrizeSuccessToastMessage,
  tryApplyCompetitionPrize,
} from '../src/logic/competitionPrizeRedemption.js';
import { useGameStore } from '../src/store/useGameStore.js';
import { usePlayerStore } from '../src/store/usePlayerStore.js';

vi.mock('../src/audio/audioEngine.js');

const gold = COMPETITION_PRIZE_CODE_ENTRIES.find((e) => e.reward.furnitureId === 'winner_trophy_gold')!;
const silver = COMPETITION_PRIZE_CODE_ENTRIES.find((e) => e.reward.furnitureId === 'winner_trophy_silver')!;
const bronze = COMPETITION_PRIZE_CODE_ENTRIES.find((e) => e.reward.furnitureId === 'winner_trophy_bronze')!;

beforeEach(() => {
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  useGameStore.setState(useGameStore.getInitialState(), true);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('konkurrencens varighed og nedtælling', () => {
  it('varer 15 minutter, og tiden før start viser 15:00', () => {
    expect(FISHING_COMPETITION_DURATION_MS).toBe(15 * 60 * 1000);
    expect(FISHING_COMPETITION_IDLE_TIME_LABEL).toBe('15:00');
  });

  it('viser hele tiden lige ved start', () => {
    expect(competitionTimeLeft(1000, 1000)).toEqual({ remainingMs: FISHING_COMPETITION_DURATION_MS, label: '15:00' });
  });

  it('runder ned til hele sekunder og skriver sekunder med to cifre', () => {
    expect(competitionTimeLeft(0, 1).label).toBe('14:59');
    expect(competitionTimeLeft(0, 60_000).label).toBe('14:00');
    expect(competitionTimeLeft(0, 14 * 60_000 + 55_500).label).toBe('0:04');
    expect(competitionTimeLeft(0, FISHING_COMPETITION_DURATION_MS - 999).label).toBe('0:00');
    expect(competitionTimeLeft(0, FISHING_COMPETITION_DURATION_MS - 999).remainingMs).toBe(999);
  });

  it('når 0:00 præcis ved udløb og bliver aldrig negativ', () => {
    expect(competitionTimeLeft(0, FISHING_COMPETITION_DURATION_MS)).toEqual({ remainingMs: 0, label: '0:00' });
    expect(competitionTimeLeft(0, FISHING_COMPETITION_DURATION_MS + 3_600_000)).toEqual({ remainingMs: 0, label: '0:00' });
  });

  it('nedtællingen falder hvert sekund uden spring', () => {
    let prev = Infinity;
    for (let t = 0; t <= FISHING_COMPETITION_DURATION_MS; t += 1000) {
      const { remainingMs, label } = competitionTimeLeft(0, t);
      expect(remainingMs).toBeLessThan(prev);
      expect(label).toMatch(/^\d{1,2}:[0-5]\d$/);
      prev = remainingMs;
    }
  });
});

describe('konkurrence i spillets tilstand', () => {
  it('starter uden konkurrence', () => {
    const s = useGameStore.getState();
    expect(s.competitionStartedAt).toBeNull();
    expect(s.competitionCatches).toBe(0);
    expect(s.competitionFinished).toBe(false);
  });

  it('start sætter tidspunktet og nulstiller fangster', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-18T10:00:00Z'));
    useGameStore.setState({ competitionCatches: 7, competitionFinished: true });
    useGameStore.getState().startCompetition();
    const s = useGameStore.getState();
    expect(s.competitionStartedAt).toBe(Date.parse('2026-11-18T10:00:00Z'));
    expect(s.competitionCatches).toBe(0);
    expect(s.competitionFinished).toBe(false);
  });

  it('tæller fangster og kan afsluttes og nulstilles', () => {
    const g = useGameStore.getState();
    g.startCompetition();
    g.incrementCompetitionCatches();
    g.incrementCompetitionCatches();
    expect(useGameStore.getState().competitionCatches).toBe(2);
    g.setCompetitionFinished(true);
    expect(useGameStore.getState().competitionFinished).toBe(true);
    g.resetCompetition();
    const s = useGameStore.getState();
    expect(s.competitionStartedAt).toBeNull();
    expect(s.competitionCatches).toBe(0);
    expect(s.competitionFinished).toBe(false);
  });
});

describe('præmiekoder', () => {
  it('der er præcis én præmie for hver af de tre podiepladser', () => {
    expect(COMPETITION_PRIZE_CODE_ENTRIES).toHaveLength(3);
    expect([gold, silver, bronze].every(Boolean)).toBe(true);
  });

  it('alle koder er seks cifre og forskellige', () => {
    const codes = COMPETITION_PRIZE_CODE_ENTRIES.flatMap((e) => e.codes);
    for (const c of codes) expect(c, c).toMatch(/^\d{6}$/);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('præmien falder med pladsen', () => {
    expect(gold.reward.coins).toBeGreaterThan(silver.reward.coins);
    expect(silver.reward.coins).toBeGreaterThan(bronze.reward.coins);
    expect(bronze.reward.coins).toBeGreaterThan(0);
  });

  it('beløbet i teksten passer med præmien', () => {
    for (const e of COMPETITION_PRIZE_CODE_ENTRIES) {
      expect(e.shortLabel, e.shortLabel).toContain(e.reward.coins.toLocaleString('da-DK'));
    }
  });

  it('trofæerne findes som møbler i hytten', () => {
    for (const e of COMPETITION_PRIZE_CODE_ENTRIES) {
      const id = e.reward.furnitureId;
      expect(QUEST_COMPANION_DEFAULTS[id], id).toBe('living');
      expect(getFurnitureDisplayLabel(id), id).not.toBe(id);
    }
  });

  it('hver kode finder sin egen præmie', () => {
    for (const e of COMPETITION_PRIZE_CODE_ENTRIES) {
      for (const c of e.codes) expect(findCompetitionPrizeByCode(c)).toBe(e);
    }
  });

  it('forkerte og næsten-rigtige koder afvises', () => {
    const code = gold.codes[0]!;
    for (const bad of ['', '000000', code.slice(0, 5), `${code}0`, ` ${code}`, `${code} `, '123456']) {
      expect(findCompetitionPrizeByCode(bad), JSON.stringify(bad)).toBeNull();
    }
  });
});

describe('indløsning af præmie', () => {
  it('giver mønter og trofæ', () => {
    usePlayerStore.getState().setCoins(250);
    expect(tryApplyCompetitionPrize(silver)).toEqual({ success: true });
    const p = usePlayerStore.getState();
    expect(p.coins).toBe(250 + silver.reward.coins);
    expect(p.unlockedFurniture).toContain('winner_trophy_silver');
  });

  it('samme præmie kan ikke indløses to gange', () => {
    tryApplyCompetitionPrize(gold);
    const coinsAfterFirst = usePlayerStore.getState().coins;
    expect(tryApplyCompetitionPrize(gold)).toEqual({ success: false, code: 'already_has_trophy' });
    const p = usePlayerStore.getState();
    expect(p.coins).toBe(coinsAfterFirst);
    expect(p.unlockedFurniture.filter((f) => f === 'winner_trophy_gold')).toHaveLength(1);
  });

  it('forskellige pladser kan indløses hver for sig', () => {
    for (const e of [gold, silver, bronze]) expect(tryApplyCompetitionPrize(e).success).toBe(true);
    const p = usePlayerStore.getState();
    expect(p.coins).toBe(gold.reward.coins + silver.reward.coins + bronze.reward.coins);
    expect(p.unlockedFurniture).toEqual(
      expect.arrayContaining(['winner_trophy_gold', 'winner_trophy_silver', 'winner_trophy_bronze']),
    );
  });

  it('besked efter indløsning nævner beløbet og trofæet', () => {
    expect(competitionPrizeSuccessToastMessage(gold)).toContain('10.000 kr');
    expect(competitionPrizeSuccessToastMessage(gold)).toContain('guldvindertrofæet');
    expect(competitionPrizeSuccessToastMessage(silver)).toContain('5.000 kr');
    expect(competitionPrizeSuccessToastMessage(bronze)).toContain('3.000 kr');
    expect(competitionPrizeSuccessToastMessage(bronze)).toContain('podietrofæet');
  });
});
