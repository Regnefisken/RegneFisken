import { vi } from 'vitest';

/** Lader `Math.random()` returnere en fast værdi, indtil `vi.restoreAllMocks()` kaldes. */
export function fixRandom(value: number): void {
  vi.spyOn(Math, 'random').mockReturnValue(value);
}

/**
 * Lader `Math.random()` returnere værdierne i rækkefølge; når listen er brugt op,
 * gentages den sidste værdi.
 */
export function sequenceRandom(values: number[]): void {
  let i = 0;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    const v = values[Math.min(i, values.length - 1)]!;
    i += 1;
    return v;
  });
}
