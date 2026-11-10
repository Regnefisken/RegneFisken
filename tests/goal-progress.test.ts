import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GOALS } from '../src/data/progression.js';
import { FULL_UPGRADE_ITEM_IDS, SHOP_ITEMS, countFullUpgradeItemsOwned } from '../src/data/shop.js';
import { buildGoalStatsSnapshot } from '../src/logic/goal-progress.js';
import { getGoalRowProgress } from '../src/logic/goal-row-progress.js';
import { emptyStats } from '../src/logic/xp-engine.js';
import { useCollectionStore } from '../src/store/useCollectionStore.js';
import { usePlayerStore } from '../src/store/usePlayerStore.js';

vi.mock('../src/audio/audioEngine.js');

const fullUpgrade = GOALS.find((g) => g.id === 'full_upgrade')!;
const firstUpgrade = GOALS.find((g) => g.id === 'first_upgrade')!;
const byId = new Map(SHOP_ITEMS.map((i) => [i.id, i]));

beforeEach(() => {
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  useCollectionStore.setState(useCollectionStore.getInitialState(), true);
});

describe('FULL_UPGRADE_ITEM_IDS', () => {
  it('indeholder kun varige varer, der kan købes for mønter', () => {
    expect(FULL_UPGRADE_ITEM_IDS.length).toBeGreaterThan(0);
    for (const id of FULL_UPGRADE_ITEM_IDS) {
      const item = byId.get(id)!;
      expect(item, id).toBeDefined();
      expect(item.consumable ?? false, id).toBe(false);
      expect(item.cost, id).toBeGreaterThan(0);
    }
  });

  it('udelader madding, gratis belønninger og samleobjekter med andre kilder', () => {
    for (const id of ['bait_fly', 'bait_conch', 'legendary_bait', 'pirate_hat', 'cheese_bought', 'feather_bought']) {
      expect(FULL_UPGRADE_ITEM_IDS, id).not.toContain(id);
    }
  });

  it('indeholder stænger, spande og rejseudstyr', () => {
    for (const id of ['rod_mahogni', 'bucket_gold', 'travel_pass', 'rowboat', 'luxury_boat', 'golden_hook']) {
      expect(FULL_UPGRADE_ITEM_IDS, id).toContain(id);
    }
  });

  it('tæller hver vare én gang og ignorerer alt andet', () => {
    expect(countFullUpgradeItemsOwned([])).toBe(0);
    expect(countFullUpgradeItemsOwned(['rod_havblaa', 'rod_havblaa', 'pirate_hat', 'ukendt'])).toBe(1);
    expect(countFullUpgradeItemsOwned([...FULL_UPGRADE_ITEM_IDS])).toBe(FULL_UPGRADE_ITEM_IDS.length);
  });
});

describe('målet "Fuldt udrustet"', () => {
  it('opfyldes ikke af mange køb af madding', () => {
    usePlayerStore.setState({ stats: { ...emptyStats(), upgradesBought: 500 } });
    const snapshot = buildGoalStatsSnapshot();
    expect(fullUpgrade.condition(snapshot)).toBe(false);
    expect(getGoalRowProgress(fullUpgrade, snapshot)).toEqual({
      cur: 0,
      max: FULL_UPGRADE_ITEM_IDS.length,
    });
  });

  it('opfyldes ikke når én vare mangler', () => {
    usePlayerStore.setState({ upgrades: FULL_UPGRADE_ITEM_IDS.slice(1) });
    const snapshot = buildGoalStatsSnapshot();
    expect(fullUpgrade.condition(snapshot)).toBe(false);
    expect(getGoalRowProgress(fullUpgrade, snapshot)).toEqual({
      cur: FULL_UPGRADE_ITEM_IDS.length - 1,
      max: FULL_UPGRADE_ITEM_IDS.length,
    });
  });

  it('opfyldes når alle varige varer ejes — uden Sørøverens Hat', () => {
    usePlayerStore.setState({ upgrades: [...FULL_UPGRADE_ITEM_IDS] });
    const snapshot = buildGoalStatsSnapshot();
    expect(fullUpgrade.condition(snapshot)).toBe(true);
    expect(getGoalRowProgress(fullUpgrade, snapshot)).toEqual({
      cur: FULL_UPGRADE_ITEM_IDS.length,
      max: FULL_UPGRADE_ITEM_IDS.length,
    });
  });

  it('er ikke opfyldt for en ny spiller', () => {
    expect(fullUpgrade.condition(buildGoalStatsSnapshot())).toBe(false);
    expect(fullUpgrade.condition(emptyStats())).toBe(false);
  });
});

describe('målet "Første investering"', () => {
  it('tæller stadig ethvert køb, også madding', () => {
    usePlayerStore.setState({ stats: { ...emptyStats(), upgradesBought: 1 } });
    expect(firstUpgrade.condition(buildGoalStatsSnapshot())).toBe(true);
  });
});
