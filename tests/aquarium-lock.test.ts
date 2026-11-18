import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FURNITURE_SHOP_ITEMS, getFurnitureBuyStatus } from '../src/data/furnitureShopItems.js';
import {
  AQUARIUM_PUMP_QUEST,
  JUNGLE_CHEST_OPENED_QUEST,
  grantAquariumPump,
  markJungleChestParchmentSeen,
} from '../src/logic/jungle-chest-reveal.js';
import { useCollectionStore } from '../src/store/useCollectionStore.js';
import { usePlayerStore } from '../src/store/usePlayerStore.js';

vi.mock('../src/audio/audioEngine.js');

const aquarium = FURNITURE_SHOP_ITEMS.find((i) => i.id === 'aquarium')!;
const fireplace = FURNITURE_SHOP_ITEMS.find((i) => i.id === 'fireplace')!;

beforeEach(() => {
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  useCollectionStore.setState(useCollectionStore.getInitialState(), true);
});

describe('akvariet i møbelbutikken', () => {
  it('kræver akvariepumpen og forklarer, hvad der mangler', () => {
    expect(aquarium.requiresQuestItem).toBe(AQUARIUM_PUMP_QUEST);
    expect(aquarium.lockedHint).toMatch(/akvariepumpe/i);
  });

  it('kan ikke købes uden pumpe, selv med penge nok', () => {
    expect(getFurnitureBuyStatus(aquarium, 100_000, [], [])).toBe('missing_part');
  });

  it('kan købes med pumpe og penge nok', () => {
    expect(getFurnitureBuyStatus(aquarium, aquarium.price, [], [AQUARIUM_PUMP_QUEST])).toBe('available');
  });

  it('mangler stadig penge, når pumpen er fundet', () => {
    expect(getFurnitureBuyStatus(aquarium, aquarium.price - 1, [], [AQUARIUM_PUMP_QUEST])).toBe('broke');
  });

  it('spillere, der allerede ejer akvariet, beholder det uden pumpe', () => {
    expect(getFurnitureBuyStatus(aquarium, 0, ['aquarium'], [])).toBe('owned');
  });

  it('akvariet er det eneste møbel, der kræver en quest-genstand', () => {
    expect(FURNITURE_SHOP_ITEMS.filter((i) => i.requiresQuestItem).map((i) => i.id)).toEqual(['aquarium']);
  });

  it('andre møbler virker som før', () => {
    expect(getFurnitureBuyStatus(fireplace, fireplace.price, [], [])).toBe('available');
    expect(getFurnitureBuyStatus(fireplace, fireplace.price - 1, [], [])).toBe('broke');
    expect(getFurnitureBuyStatus(fireplace, 0, ['fireplace'], [])).toBe('owned');
  });
});

describe('akvariepumpen i jungle-kisten', () => {
  it('gives én gang', () => {
    expect(grantAquariumPump()).toBe(true);
    expect(grantAquariumPump()).toBe(false);
    expect(usePlayerStore.getState().questItems.filter((q) => q === AQUARIUM_PUMP_QUEST)).toHaveLength(1);
  });

  it('gives, når pergamentet fra kisten er læst', () => {
    markJungleChestParchmentSeen();
    const q = usePlayerStore.getState().questItems;
    expect(q).toContain(JUNGLE_CHEST_OPENED_QUEST);
    expect(q).toContain(AQUARIUM_PUMP_QUEST);
  });

  it('spillere, der åbnede kisten før pumpen kom i den, kan stadig få den', () => {
    usePlayerStore.setState({ questItems: ['jungle_chest_key', JUNGLE_CHEST_OPENED_QUEST] });
    expect(grantAquariumPump()).toBe(true);
    expect(usePlayerStore.getState().questItems).toContain(AQUARIUM_PUMP_QUEST);
  });

  it('bevarer de andre quest-genstande', () => {
    usePlayerStore.setState({ questItems: ['cabin_key', 'map_left'] });
    grantAquariumPump();
    expect(usePlayerStore.getState().questItems).toEqual(['cabin_key', 'map_left', AQUARIUM_PUMP_QUEST]);
  });
});
