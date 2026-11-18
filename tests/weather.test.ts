import { afterEach, describe, expect, it, vi } from 'vitest';
import { LOCATIONS } from '../src/data/locations.js';
import { WEATHER_TYPES, isWeatherTypeId, type WeatherTypeId } from '../src/data/weather.js';
import {
  ARCTIC_LOCATIONS,
  CAVE_LOCATIONS,
  DARK_DUR,
  STD_DUR,
  SUNNY_LOCATIONS,
  durationMs,
  isDarkLocation,
  pickNextWeather,
  rollThunder,
  toArcticWeather,
  toCaveWeather,
} from '../src/logic/weather-rules.js';
import { CABIN_LOCATIONS } from '../src/logic/location-helpers.js';
import { getWeatherEntry } from '../src/three/logic/environment.js';
import { fixRandom } from './helpers/random.js';

afterEach(() => {
  vi.restoreAllMocks();
});

const ALL_WEATHER: WeatherTypeId[] = ['clear', 'overcast', 'rain', 'storm', 'fog', 'snow', 'snowstorm'];
const LOCATION_IDS = Object.keys(LOCATIONS);
/** Jævnt fordelte værdier for `Math.random()`, så alle grene i overgangstabellerne rammes. */
const RANDOM_SWEEP = Array.from({ length: 20 }, (_, i) => i / 20 + 0.025);

/** Næste vejr med en fast værdi for `Math.random()`. */
function next(locationId: string, current: WeatherTypeId, r: number, level = 10, prev: WeatherTypeId = 'clear') {
  fixRandom(r);
  const result = pickNextWeather({ level, locationId, current, prev });
  vi.restoreAllMocks();
  return result;
}

/** Alle udfald fra `current` på en lokation, over hele `RANDOM_SWEEP` og alle forrige vejrtyper. */
function allOutcomes(locationId: string, current: WeatherTypeId, level = 10): Set<WeatherTypeId> {
  const out = new Set<WeatherTypeId>();
  for (const prev of ALL_WEATHER) {
    for (const r of RANDOM_SWEEP) out.add(next(locationId, current, r, level, prev));
  }
  return out;
}

describe('vejrtyper', () => {
  it('hver nøgle i WEATHER_TYPES svarer til sit id', () => {
    for (const [key, w] of Object.entries(WEATHER_TYPES)) {
      expect(w.id.toUpperCase()).toBe(key);
    }
  });

  it('dækker præcis de syv vejrtyper', () => {
    expect(Object.values(WEATHER_TYPES).map((w) => w.id).sort()).toEqual([...ALL_WEATHER].sort());
  });

  it('isWeatherTypeId kender alle typer og afviser andet', () => {
    for (const id of ALL_WEATHER) expect(isWeatherTypeId(id), id).toBe(true);
    for (const bad of ['', 'Clear', 'sun', 'hail', 'CLEAR']) expect(isWeatherTypeId(bad), bad).toBe(false);
  });

  it('flagene passer til typen', () => {
    expect(WEATHER_TYPES.RAIN.rain).toBe(true);
    expect(WEATHER_TYPES.STORM.rain && WEATHER_TYPES.STORM.storm).toBe(true);
    expect(WEATHER_TYPES.SNOW.snow).toBe(true);
    expect(WEATHER_TYPES.SNOWSTORM.snow && WEATHER_TYPES.SNOWSTORM.storm).toBe(true);
    expect(WEATHER_TYPES.SNOWSTORM.rain).toBe(false);
    for (const w of [WEATHER_TYPES.CLEAR, WEATHER_TYPES.OVERCAST, WEATHER_TYPES.FOG]) {
      expect(w.rain || w.storm || w.snow, w.id).toBe(false);
    }
  });

  it('lys og bølger har fornuftige værdier', () => {
    for (const w of Object.values(WEATHER_TYPES)) {
      expect(w.lightMod, w.id).toBeGreaterThan(0);
      expect(w.lightMod, w.id).toBeLessThanOrEqual(1);
      expect(w.waveAmp, w.id).toBeGreaterThan(0);
      expect(w.fogDens, w.id).toBeGreaterThan(0);
    }
    expect(WEATHER_TYPES.CLEAR.lightMod).toBe(1);
    expect(WEATHER_TYPES.STORM.lightMod).toBeLessThan(WEATHER_TYPES.RAIN.lightMod);
  });

  it('getWeatherEntry finder typen og falder tilbage til klart vejr', () => {
    for (const id of ALL_WEATHER) expect(getWeatherEntry(id).id).toBe(id);
    expect(getWeatherEntry('ukendt').id).toBe('clear');
    expect(getWeatherEntry('').id).toBe('clear');
  });
});

describe('varighed', () => {
  it('alle vejrtyper har en varighed i begge tabeller, og min er under max', () => {
    for (const table of [STD_DUR, DARK_DUR]) {
      for (const id of ALL_WEATHER) {
        const [min, max] = table[id];
        expect(min, id).toBeGreaterThan(0);
        expect(min, id).toBeLessThan(max);
      }
    }
  });

  it('mørke lokationer skifter vejr mindst lige så tit', () => {
    for (const id of ALL_WEATHER) {
      expect(DARK_DUR[id][1], id).toBeLessThanOrEqual(STD_DUR[id][1]);
    }
  });

  it('durationMs ligger inden for tabellens grænser', () => {
    for (const dark of [false, true]) {
      const table = dark ? DARK_DUR : STD_DUR;
      for (const id of ALL_WEATHER) {
        fixRandom(0);
        expect(durationMs(id, dark)).toBe(table[id][0]);
        vi.restoreAllMocks();
        fixRandom(0.999999);
        const d = durationMs(id, dark);
        expect(d).toBeLessThan(table[id][1]);
        expect(d).toBeGreaterThan(table[id][1] - 1);
        vi.restoreAllMocks();
      }
    }
  });
});

describe('lokationsgrupper', () => {
  it('alle lokationer i grupperne findes', () => {
    for (const set of [SUNNY_LOCATIONS, ARCTIC_LOCATIONS, CAVE_LOCATIONS]) {
      for (const id of set) expect(LOCATION_IDS, id).toContain(id);
    }
  });

  it('alle rum i fiskehytten, også kælderen, har fast klart vejr', () => {
    for (const id of [...CABIN_LOCATIONS, 'cabin_cellar']) {
      expect(SUNNY_LOCATIONS.has(id), id).toBe(true);
    }
  });

  it('ingen lokation er i to grupper', () => {
    for (const id of LOCATION_IDS) {
      const n = [SUNNY_LOCATIONS, ARCTIC_LOCATIONS, CAVE_LOCATIONS].filter((s) => s.has(id)).length;
      expect(n, id).toBeLessThanOrEqual(1);
    }
  });

  it('isDarkLocation følger lokationens regler', () => {
    expect(isDarkLocation('abyss')).toBe(true);
    expect(isDarkLocation('forbidden')).toBe(true);
    expect(isDarkLocation('pier')).toBe(false);
    expect(isDarkLocation('ukendt')).toBe(false);
  });
});

describe('pickNextWeather: oplåsning efter level', () => {
  it('under level 5 er det altid klart vejr, uanset sted og nuværende vejr', () => {
    for (const level of [1, 2, 4]) {
      for (const loc of LOCATION_IDS) {
        for (const current of ALL_WEATHER) {
          expect(allOutcomes(loc, current, level), `${loc} ${current} L${level}`).toEqual(new Set(['clear']));
        }
      }
    }
  });

  it('level 5-9 giver kun klart eller overskyet', () => {
    for (const level of [5, 9]) {
      for (const loc of LOCATION_IDS) {
        for (const current of ALL_WEATHER) {
          for (const w of allOutcomes(loc, current, level)) {
            expect(['clear', 'overcast'], `${loc} ${current} L${level}`).toContain(w);
          }
        }
      }
    }
  });

  it('level 5-9: alt andet end klart og overskyet bliver klart', () => {
    for (const current of ['rain', 'storm', 'fog', 'snow', 'snowstorm'] as const) {
      expect(allOutcomes('smaragd', current, 7)).toEqual(new Set(['clear']));
    }
  });

  it('level 5-9: overgangene mellem klart og overskyet', () => {
    expect(next('smaragd', 'clear', 0.49, 7)).toBe('overcast');
    expect(next('smaragd', 'clear', 0.5, 7)).toBe('clear');
    expect(next('smaragd', 'overcast', 0.39, 7)).toBe('clear');
    expect(next('smaragd', 'overcast', 0.4, 7)).toBe('overcast');
  });
});

describe('pickNextWeather: steder med fast vejr', () => {
  it('solrige steder har altid klart vejr', () => {
    for (const loc of SUNNY_LOCATIONS) {
      for (const current of ALL_WEATHER) {
        expect(allOutcomes(loc, current, 30), `${loc} ${current}`).toEqual(new Set(['clear']));
      }
    }
  });

  it('Ishavet får aldrig regn eller storm, kun sne og snestorm', () => {
    for (const current of ALL_WEATHER) {
      for (const w of allOutcomes('arctic_sea', current)) {
        expect(['rain', 'storm'], `${current} → ${w}`).not.toContain(w);
      }
    }
    expect(allOutcomes('arctic_sea', 'overcast')).toContain('snow');
    expect(allOutcomes('arctic_sea', 'snow')).toContain('snowstorm');
  });

  it('grotten har kun klart, overskyet og tåge', () => {
    for (const current of ALL_WEATHER) {
      for (const w of allOutcomes('cave', current)) {
        expect(['clear', 'overcast', 'fog'], `${current} → ${w}`).toContain(w);
      }
    }
  });

  it('andre steder end Ishavet får aldrig sne', () => {
    for (const loc of LOCATION_IDS.filter((id) => !ARCTIC_LOCATIONS.has(id))) {
      for (const current of ALL_WEATHER) {
        for (const w of allOutcomes(loc, current)) {
          expect(['snow', 'snowstorm'], `${loc} ${current} → ${w}`).not.toContain(w);
        }
      }
    }
  });

  it('svaret er altid en gyldig vejrtype', () => {
    for (const loc of [...LOCATION_IDS, 'ukendt']) {
      for (const current of ALL_WEATHER) {
        for (const w of allOutcomes(loc, current)) expect(isWeatherTypeId(w), `${loc} ${current}`).toBe(true);
      }
    }
  });
});

describe('pickNextWeather: almindelige steder (level 10+)', () => {
  const loc = 'smaragd';

  it('klart vejr bliver overskyet eller forbliver klart', () => {
    expect(next(loc, 'clear', 0.54)).toBe('overcast');
    expect(next(loc, 'clear', 0.55)).toBe('clear');
  });

  it('overskyet bliver regn, tåge eller klart', () => {
    expect(next(loc, 'overcast', 0.54)).toBe('rain');
    expect(next(loc, 'overcast', 0.6)).toBe('fog');
    expect(next(loc, 'overcast', 0.7)).toBe('clear');
  });

  it('regn bliver til storm eller klart', () => {
    expect(next(loc, 'rain', 0.49)).toBe('storm');
    expect(next(loc, 'rain', 0.5)).toBe('clear');
  });

  it('storm går altid over i regn, og regnen efter en storm bliver ikke til storm igen', () => {
    expect(allOutcomes(loc, 'storm')).toEqual(new Set(['rain']));
    for (const r of RANDOM_SWEEP) {
      expect(['clear', 'overcast']).toContain(next(loc, 'rain', r, 10, 'storm'));
    }
  });

  it('tåge letter til overskyet eller klart', () => {
    expect(next(loc, 'fog', 0.49)).toBe('overcast');
    expect(next(loc, 'fog', 0.5)).toBe('clear');
  });

  it('vejret kan altid vende tilbage til klart', () => {
    for (const current of ['clear', 'overcast', 'rain', 'fog'] as const) {
      expect(allOutcomes(loc, current), current).toContain('clear');
    }
  });
});

describe('pickNextWeather: mørke steder (level 10+)', () => {
  it('bruger den mørke tabel, hvor regn oftere bliver til storm eller tåge', () => {
    expect(next('abyss', 'rain', 0.6)).toBe('storm');
    expect(next('smaragd', 'rain', 0.6)).toBe('clear');
    expect(next('abyss', 'rain', 0.7)).toBe('fog');
    expect(next('abyss', 'rain', 0.9)).toBe('clear');
  });

  it('tåge kan blive til regn', () => {
    expect(next('forbidden', 'fog', 0.4)).toBe('rain');
    expect(next('forbidden', 'fog', 0.6)).toBe('overcast');
    expect(next('forbidden', 'fog', 0.8)).toBe('clear');
  });
});

describe('vejr ved rejse', () => {
  it('Ishavet laver regn om til sne og storm om til snestorm', () => {
    expect(toArcticWeather('rain')).toBe('snow');
    expect(toArcticWeather('storm')).toBe('snowstorm');
    for (const w of ['clear', 'overcast', 'fog', 'snow', 'snowstorm'] as const) {
      expect(toArcticWeather(w)).toBe(w);
    }
  });

  it('grotten fjerner nedbør', () => {
    for (const w of ['rain', 'storm', 'snow', 'snowstorm'] as const) expect(toCaveWeather(w)).toBe('clear');
    for (const w of ['clear', 'overcast', 'fog'] as const) expect(toCaveWeather(w)).toBe(w);
  });
});

describe('torden', () => {
  it('storm og snestorm tordner i 60 % af tilfældene', () => {
    for (const w of ['storm', 'snowstorm'] as const) {
      fixRandom(0.59);
      expect(rollThunder(w)).toBe(true);
      vi.restoreAllMocks();
      fixRandom(0.6);
      expect(rollThunder(w)).toBe(false);
      vi.restoreAllMocks();
    }
  });

  it('regn tordner i 30 % af tilfældene', () => {
    fixRandom(0.29);
    expect(rollThunder('rain')).toBe(true);
    vi.restoreAllMocks();
    fixRandom(0.3);
    expect(rollThunder('rain')).toBe(false);
  });

  it('tørt vejr og sne tordner aldrig', () => {
    fixRandom(0);
    for (const w of ['clear', 'overcast', 'fog', 'snow'] as const) expect(rollThunder(w), w).toBe(false);
  });
});
