import { describe, expect, it } from 'vitest';
import { LOCATIONS, getLocation } from '../src/data/locations.js';
import { ARCTIC_SET, DESERT_SET } from '../src/data/progression.js';
import { isCabinLocation } from '../src/logic/location-helpers.js';
import {
  canOpenTravelMenu,
  destinationAllowsTravel,
  getUnlockedAreas,
  isAreaUnlocked,
} from '../src/logic/travel-unlock.js';

function unlocked(level: number, upgrades: string[] = [], questItems: string[] = []): string[] {
  return getUnlockedAreas(level, upgrades, questItems).map((a) => a.id);
}

describe('getUnlockedAreas', () => {
  it('en ny spiller kan kun være på molen og har ingen rejsemenu', () => {
    expect(unlocked(1)).toEqual(['pier']);
    expect(canOpenTravelMenu(1, [], [])).toBe(false);
  });

  it('højt level alene åbner ingen nye steder', () => {
    expect(unlocked(99)).toEqual(['pier']);
  });

  it('Skovsøen kræver Rejsekort og level 3', () => {
    expect(unlocked(2, ['travel_pass'])).not.toContain('smaragd');
    expect(unlocked(3, ['travel_pass'])).toContain('smaragd');
    expect(unlocked(3, [])).not.toContain('smaragd');
  });

  it('Dybet kræver Rejsekort og level 8', () => {
    expect(unlocked(7, ['travel_pass'])).not.toContain('abyss');
    expect(unlocked(8, ['travel_pass'])).toContain('abyss');
  });

  it('Den Forbudte Sø kræver begge halvdele af skattekortet', () => {
    expect(unlocked(1, ['map_right'], [])).not.toContain('forbidden');
    expect(unlocked(1, [], ['map_left'])).not.toContain('forbidden');
    expect(unlocked(1, ['map_right'], ['map_left'])).toContain('forbidden');
    expect(unlocked(1, [], ['map_left', 'map_right'])).toContain('forbidden');
  });

  it('Ørkensøen kræver hele ørkensættet', () => {
    expect(unlocked(1, [...DESERT_SET])).toContain('desert_lake');
    for (const missing of DESERT_SET) {
      const partial = DESERT_SET.filter((x) => x !== missing);
      expect(unlocked(1, partial), `uden ${missing}`).not.toContain('desert_lake');
    }
  });

  it('Ishavet kræver hele vintersættet', () => {
    expect(unlocked(1, [...ARCTIC_SET])).toContain('arctic_sea');
    for (const missing of ARCTIC_SET) {
      const partial = ARCTIC_SET.filter((x) => x !== missing);
      expect(unlocked(1, partial), `uden ${missing}`).not.toContain('arctic_sea');
    }
  });

  it('fiskehyttens tre rum kræver både magnet og nøgle', () => {
    const rooms = ['cabin_living', 'cabin_kitchen', 'cabin_bedroom'];
    const all = unlocked(1, ['magnet'], ['cabin_key']);
    for (const r of rooms) expect(all).toContain(r);
    for (const r of rooms) {
      expect(unlocked(1, ['magnet'], [])).not.toContain(r);
      expect(unlocked(1, [], ['cabin_key'])).not.toContain(r);
    }
  });

  it('kælderen åbner ikke med hyttenøglen alene', () => {
    expect(unlocked(99, ['magnet'], ['cabin_key'])).not.toContain('cabin_cellar');
    expect(unlocked(1, [], ['cellar_handle'])).toContain('cabin_cellar');
    expect(isCabinLocation('cabin_cellar')).toBe(false);
  });

  it('Den Tropiske Ø kræver robåd; grotten kræver robåd og pandelampe', () => {
    expect(unlocked(1, ['rowboat'])).toContain('tropical_island');
    expect(unlocked(1, ['rowboat'])).not.toContain('cave');
    expect(unlocked(1, ['headlamp'])).not.toContain('cave');
    expect(unlocked(1, ['rowboat', 'headlamp'])).toContain('cave');
  });

  it('Jungleøen åbner først når den er opdaget', () => {
    expect(unlocked(99, ['rowboat', 'luxury_boat'])).not.toContain('jungle_island');
    expect(unlocked(1, [], ['jungle_discovered'])).toContain('jungle_island');
  });

  it('flere ting giver aldrig færre steder', () => {
    const everything = [
      'travel_pass',
      'map_right',
      'magnet',
      'rowboat',
      'headlamp',
      ...DESERT_SET,
      ...ARCTIC_SET,
    ];
    const quest = ['map_left', 'cabin_key', 'jungle_discovered', 'cellar_handle'];
    let prev: string[] = [];
    for (let n = 0; n <= everything.length; n++) {
      const now = unlocked(20, everything.slice(0, n), quest);
      for (const id of prev) expect(now, `mistede ${id} ved ${n} ting`).toContain(id);
      prev = now;
    }
    expect(prev.sort()).toEqual(Object.keys(LOCATIONS).sort());
  });
});

describe('isAreaUnlocked / canOpenTravelMenu', () => {
  it('stemmer overens med listen over åbne steder', () => {
    const upgrades = ['travel_pass', 'rowboat'];
    const open = unlocked(5, upgrades);
    for (const id of Object.keys(LOCATIONS)) {
      expect(isAreaUnlocked(getLocation(id), 5, upgrades, []), id).toBe(open.includes(id));
    }
  });

  it('rejsemenuen åbner når der er mere end ét sted', () => {
    expect(canOpenTravelMenu(3, ['travel_pass'], [])).toBe(true);
    expect(canOpenTravelMenu(2, ['travel_pass'], [])).toBe(false);
  });
});

describe('destinationAllowsTravel', () => {
  it('steder med Rejsekort-krav afviser uden kortet', () => {
    for (const id of ['smaragd', 'abyss']) {
      expect(destinationAllowsTravel(id, [])).toEqual({
        ok: false,
        message: 'Du mangler Rejsekortet! Køb det i butikken.',
      });
      expect(destinationAllowsTravel(id, ['travel_pass'])).toEqual({ ok: true });
    }
  });

  it('molen kan man altid rejse til', () => {
    expect(destinationAllowsTravel('pier', [])).toEqual({ ok: true });
  });
});
