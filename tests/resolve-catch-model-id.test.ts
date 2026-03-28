import { describe, it, expect } from 'vitest';
import { resolveCuteFishId } from '../src/three/models/resolveCatchModelId.js';
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

describe('resolveCuteFishId', () => {
  it('bruger fishModelId når sat', () => {
    expect(resolveCuteFishId(baseCatch({ fishModelId: 'fisk_torsk' }))).toBe('fisk_torsk');
  });

  it('mapper quest/boss-typer uden fishModelId', () => {
    expect(resolveCuteFishId(baseCatch({ itemType: 'bottle' }))).toBe('flaskepost');
    expect(resolveCuteFishId(baseCatch({ itemType: 'fossil' }))).toBe('fossil');
    expect(resolveCuteFishId(baseCatch({ itemType: 'conch' }))).toBe('konkylie');
    expect(resolveCuteFishId(baseCatch({ itemType: 'oyster' }))).toBe('oyster');
    expect(resolveCuteFishId(baseCatch({ itemType: 'boss_hvidhaj' }))).toBe('fisk_hvidhaj');
    expect(resolveCuteFishId(baseCatch({ itemType: 'soeuhyre' }))).toBe('fisk_soeuhyre');
  });

  it('returnerer null for ukendt type uden id', () => {
    expect(resolveCuteFishId(baseCatch({ itemType: 'nothing' }))).toBe(null);
  });
});
