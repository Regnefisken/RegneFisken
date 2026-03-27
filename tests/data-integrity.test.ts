import { describe, it, expect } from 'vitest';
import { CATCH_MASTER_DATA } from '../src/data/fish.js';
import { LOCATIONS } from '../src/data/locations.js';

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
